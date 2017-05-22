const is = require( './is.js' );
const parse = {
	rawExpressionsAndLiterals: ( templatedUrl ) => {
		const regExp = /\{([^\{\}]+)\}|([^\{\}]+)/g;
		const arr = [];
		while( regExp.lastIndex < templatedUrl.length ) {
			const [ rawExpression, rawLiteral ] = regExp.exec( templatedUrl ).slice( 1, 3 );
			arr.push( { rawExpression, rawLiteral } );
		}
		return arr;
  },
	operatorAndExpressionParts: ( rawExpression ) => {
		const [ operator, expression ] = is.operator( rawExpression.charAt( 0 ) ) ?
			[ rawExpression.charAt( 0 ), rawExpression.slice( 1 ) ] : [ undefined, rawExpression ];
		return [ operator, expression.split( /,/g )
			.map( part => /([^:\*]*)(?::(\d+)|(\*))?/.exec( part ).slice( 1 ) )
			.map( ( [ key, modifier1, modifier2 ] ) => [ key, modifier1 || modifier2 ] ) ];
	}
};
module.exports = parse;
