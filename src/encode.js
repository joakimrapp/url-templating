const is = require( './is.js' );
const encode = {
	reserved: ( str ) => !is.defined( str ) ? undefined : str.split( /(%[0-9A-Fa-f]{2})/g )
		.map( ( part ) => /%[0-9A-Fa-f]/.test( part ) ? part : encodeURI( part ).replace( /%5B/g, '[' ).replace( /%5D/g, ']' ) ).join( '' ),
	unreserved: ( str ) => encodeURIComponent( str ).replace( /[!'()*]/g, ( c ) => '%' + c.charCodeAt( 0 ).toString( 16 ).toUpperCase() ),
	value: ( operator, value, key ) => {
		const encodedValue = is.reservedOperator( operator ) ? encode.reserved( value ) : encode.unreserved( value );
		return key ? `${encode.unreserved( key )}=${encodedValue}` : encodedValue;
	}
};
module.exports = encode;
