const is = require( './is.js' );
const encode = require( './encode.js' );
const getValues = ( context, operator, key, modifier ) => {
	const value = context[ key ];
	if( is.defined( value ) )
		if( value === '' )
			if( operator === ';' )
				return [ encode.unreserved( key ) ];
			else if( operator === '&' || operator === '?' )
				return [ `${encode.unreserved( key )}=` ];
			else
				return [ '' ];
		else if( is.validPrimitiveType( value ) )
			if( modifier && modifier !== '*' )
				return [ encode.value( operator, value.toString().substring( 0, parseInt( modifier, 10 ) ),
					is.keyOperator( operator ) ? key : undefined ) ];
			else
				return [ encode.value( operator, value.toString(), is.keyOperator( operator ) ? key : undefined ) ];
		else if( modifier === '*' )
			if( Array.isArray( value ) )
				return value.filter( is.defined )
					.map( value => encode.value( operator, value, is.keyOperator( operator ) ? key : undefined ) );
			else
				return Object.keys( value ).filter( key => is.defined( value[ key ] ) )
					.map( key => encode.value( operator, value[ key ], is.keyOperator( operator ) ? key : undefined ) );
		else {
			const mapped = Array.isArray( value ) ?
				value.filter( is.defined )
					.map( value => encode.value( operator, value ) ) :
				Array.prototype.concat( ...Object.keys( value ).filter( key => is.defined( value[ key ] ) ).map( key => [
					encode.unreserved( key ),
					encode.value( operator, value[ key ].toString() )
				] ) );
			return is.keyOperator( operator ) ?
				[ `${encode.unreserved( key )}=${mapped.join( ',' )}` ] :
				[ mapped.join( ',' ) ];
		}
	else
		return undefined;
};
const expand = {
	final: ( operator, expressionParts, context ) =>
		Array.prototype.concat( ...expressionParts.map( expressionPart => getValues( context, operator, ...expressionPart ) || [] ) ),
	partial: ( operator, expressionParts, context ) => expressionParts.reduce( ( [ values, rest ], expressionPart ) => {
		const value = getValues( context, operator, ...expressionPart );
		return is.undefined( value ) ?
			[ values, rest.concat( `${expressionPart[ 0 ]}${expressionPart[ 1 ] || ''}` ) ] : [ values.concat( value ), rest ];
	}, [ [], [] ] )
};
module.exports = expand;
