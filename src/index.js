class UrlTemplate {
  static encodeReserved( str ) {
    return str === undefined ? undefined : str.split( /(%[0-9A-Fa-f]{2})/g )
      .map( ( part ) => /%[0-9A-Fa-f]/.test( part ) ? part :
        encodeURI( part ).replace( /%5B/g, '[' ).replace( /%5D/g, ']' ) )
      .join( '' );
  }
  static encodeUnreserved( str ) {
    return encodeURIComponent( str ).replace( /[!'()*]/g, ( c ) => '%' + c.charCodeAt( 0 ).toString( 16 ).toUpperCase() );
  }
  static encodeValue( operator, value, key ) {
    const encode = ( operator === '+' || operator === '#' ) ? UrlTemplate.encodeReserved : UrlTemplate.encodeUnreserved;
    return key ? `${UrlTemplate.encodeUnreserved( key )}=${encode(value)}` : encode(value);
  }
  static isDefined( value ) { return value !== undefined && value !== null; }
  static getKeyIfKeyOperator( operator, key ) { return ( operator === ';' || operator === '&' || operator === '?' ) ? key : undefined; }
  static isValidPrimitiveType( value ) {
    switch( typeof( value ) ) {
      case 'string' :
      case 'number' :
      case 'boolean' :
        return true;
			default:
				return false;
    }
  }
  static getValues( context, operator, key, modifier, value = context[ key ] ) {
    if( UrlTemplate.isDefined( value ) )
      if( value === '' )
        if( operator === ';' )
          return [ UrlTemplate.encodeUnreserved( key ) ];
        else if( operator === '&' || operator === '?' )
          return [ `${UrlTemplate.encodeUnreserved( key )}=` ];
        else
          return [ '' ];
      else if( UrlTemplate.isValidPrimitiveType( value ) )
        if( modifier && modifier !== '*' )
          return [ UrlTemplate.encodeValue( operator, value.toString().substring( 0, parseInt( modifier, 10 ) ),
            UrlTemplate.getKeyIfKeyOperator( operator, key ) ) ];
        else
          return [ UrlTemplate.encodeValue( operator, value.toString(), UrlTemplate.getKeyIfKeyOperator( operator, key ) ) ];
      else if( modifier === '*' )
        if( Array.isArray( value ) )
          return value.filter( UrlTemplate.isDefined )
            .map( value => UrlTemplate.encodeValue( operator, value, UrlTemplate.getKeyIfKeyOperator( operator, key ) ) );
        else
          return Object.keys( value ).filter( key => UrlTemplate.isDefined( value[ key ] ) )
            .map( key => UrlTemplate.encodeValue( operator, value[ key ], UrlTemplate.getKeyIfKeyOperator( operator, key ) ) );
      else {
        const mapped = Array.isArray( value ) ?
          value.filter( UrlTemplate.isDefined )
            .map( value => UrlTemplate.encodeValue( operator, value ) ) :
          Array.prototype.concat( ...Object.keys( value ).filter( key => UrlTemplate.isDefined( value[ key ] ) ).map( key => [
            UrlTemplate.encodeUnreserved( key ),
            UrlTemplate.encodeValue( operator, value[ key ].toString() )
          ] ) );
        return UrlTemplate.getKeyIfKeyOperator( operator, true ) ?
          [ `${UrlTemplate.encodeUnreserved( key )}=${mapped.join( ',' )}` ] :
          [ mapped.join( ',' ) ];
      }
  }
  static expandValues( operator, expressionParts, context ) {
    return Array.prototype.concat( ...expressionParts.map( expressionPart =>
      UrlTemplate.getValues( context, operator, ...expressionPart ) || [] ) );
  }
  static expandValuesPartial( operator, expressionParts, context ) {
    const partiallyExpandedValues = expressionParts.reduce( ( [ values, rest ], part ) => {
      const value = UrlTemplate.getValues( context, operator, ...part );
      return ( value === undefined ) || ( value === null ) || ( value.toString().length === 0 ) ?
        [ values, rest.concat( `${part[ 0 ]}${part[ 1 ] || ''}` ) ] : [ values.concat( value ), rest ];
    }, [ [], [] ] );
    return partiallyExpandedValues;
  }
  static parse( templatedUrl ) {
    const [ regExp, arr ] = [ /\{([^\{\}]+)\}|([^\{\}]+)/g, [] ];
    while( regExp.lastIndex < templatedUrl.length )
      arr.push( ( ( [ rawExpression, rawLiteral ] ) =>
        ( { rawExpression, rawLiteral } ) )( regExp.exec( templatedUrl ).slice( 1, 3 ) ) );
    return arr;
  }
  static getExpressionPart( rawExpression, keys = [] ) {
    if( UrlTemplate.isDefined( rawExpression ) ) {
      const [ operator, expression ] = '+#./;?&'.indexOf( rawExpression.charAt( 0 ) ) >= 0 ?
        [ rawExpression.charAt( 0 ), rawExpression.slice( 1 ) ] : [ undefined, rawExpression ];
      const expressionParts = expression
        .split( /,/g )
        .map( part => /([^:\*]*)(?::(\d+)|(\*))?/.exec( part ).slice( 1 ) )
        .map( ( [ key, modifier1, modifier2 ] ) => {
          keys.push( key );
          return [ key, modifier1 || modifier2 ];
        } );
      if( !operator || operator === '+' )
        return ( context, keepUnexpanded ) => {
          if( !keepUnexpanded )
            return UrlTemplate.expandValues( operator, expressionParts, context ).join( ',' );
          else {
            const [ values, rest ] = UrlTemplate.expandValuesPartial( operator, expressionParts, context );
            if( values.length )
              if( rest.length )
                return `${values.join( ',' )}{${operator || ''}${rest.join( ',' )}}`;
              else
                return values.join( ',' );
            else
              return `{${rawExpression}}`;
          }
        };
      else {
        const separator = ( operator === '?' ) ? '&' : ( operator !== '#' ) ? operator : '';
        return ( context, keepUnexpanded ) => {
          if( !keepUnexpanded ) {
            const values = UrlTemplate.expandValues( operator, expressionParts, context );
            return values.length ? `${operator}${values.join( separator || ',' )}` : '';
          }
          else {
            const [ values, rest ] = UrlTemplate.expandValuesPartial( operator, expressionParts, context );
            if( values.length )
              if( rest.length )
                return `${operator}${values.join( separator || ',' )}{${separator}${rest.join( ',' )}}`;
              else
                return `${operator}${values.join( separator || ',' )}`;
            else
              return `{${rawExpression}}`;
          }
        };
      }
    }
  }
  static getLiteralPart( rawLiteral ) {
    if( UrlTemplate.isDefined( rawLiteral ) ) {
      const literal = UrlTemplate.encodeReserved( rawLiteral );
      return () => literal;
    };
  }
  constructor( templatedUrl ) {
    const _private = {
      templatedUrl,
      templated: []
    };
    _private.templatedUrlParts = UrlTemplate.parse( templatedUrl ).map( ( { rawExpression, rawLiteral } ) =>
      UrlTemplate.getExpressionPart( rawExpression, _private.templated ) || UrlTemplate.getLiteralPart( rawLiteral ) );
    Object.assign( this, { _private } );
  }
  expand( context = {} ) { return this._private.templatedUrlParts.map( part => part( context, false ) ).join( '' ); }
  expandPartial( context = {} ) { return this._private.templatedUrlParts.map( part => part( context, true ) ).join( '' ); }
  get templatedUrl() { return this._private.templatedUrl; }
  get isTemplated() { return this._private.templated.length > 0; }
  get templated() { return this._private.templated; }
}
module.exports = ( templatedUrl ) => new UrlTemplate( templatedUrl );
