const encode = require( './encode.js' );
const expand = require( './expand.js' );
const is = require( './is.js' );
const parse = require( './parse.js' );
const create = {
	urlPart: ( { rawExpression, rawLiteral } ) => {
    if( is.defined( rawExpression ) ) {
      const [ operator, expressionParts ] = parse.operatorAndExpressionParts( rawExpression );
      if( !operator || operator === '+' )
        return ( context, keepUnexpanded ) => {
          if( !keepUnexpanded )
            return expand.final( operator, expressionParts, context ).join( ',' );
          else {
            const [ values, rest ] = expand.partial( operator, expressionParts, context );
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
            const values = expand.final( operator, expressionParts, context );
            return values.length ? `${operator}${values.join( separator || ',' )}` : '';
          }
          else {
            const [ values, rest ] = expand.partial( operator, expressionParts, context );
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
		else if( is.defined( rawLiteral ) ) {
      const literal = encode.reserved( rawLiteral );
      return () => literal;
    }
		else
			throw new Error( `Cannot create urlPart from "${rawExpression}" or "${rawLiteral}"` );
  },
	parsed: ( { rawExpression, rawLiteral } ) => {
    if( is.defined( rawExpression ) ) {
      const [ operator, expressionParts ] = parse.operatorAndExpressionParts( rawExpression );
      return expressionParts.map( ( [ key ] ) => ( { expression: true, key, query: is.keyOperator( operator ) } ) );
    }
		else if( is.defined( rawLiteral ) ) {
			return encode.reserved( rawLiteral ).split( '/' ).reduce( ( result, part, index ) => {
				if( index > 0 )
					result.push( { separator: true, value: '/' } );
				if( part.length > 0 )
					result.push( { literal: true, value: part } );
				return result;
			}, [] );
    }
		else
			throw new Error( `Cannot create parsed from "${rawExpression}" or "${rawLiteral}"` );
  }
};
module.exports = create;
