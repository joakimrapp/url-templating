const create = require( './create.js' );
const encode = require( './encode.js' );
const expand = require( './expand.js' );
const is = require( './is.js' );
const parse = require( './parse.js' );
class UrlTemplate {
  constructor( templatedUrl ) {
		this._private = { templatedUrl };
  }
	get rawExpressionsAndLiterals() {
		if( !this._private.rawExpressionsAndLiterals )
			this._private.rawExpressionsAndLiterals = parse.rawExpressionsAndLiterals( this._private.templatedUrl );
		return this._private.rawExpressionsAndLiterals;
	}
	get urlParts() {
		if( !this._private.urlParts )
			this._private.urlParts = this.rawExpressionsAndLiterals.map( create.urlPart );
		return this._private.urlParts;
	}
	get parsed() {
		if( !this._private.parsed )
			this._private.parsed = Array.prototype.concat( ...this.rawExpressionsAndLiterals.map( create.parsed ) );
		return this._private.parsed;
	}
	get templatedUrl() { return this._private.templatedUrl; }
  expand( context = {} ) { return this.urlParts.map( part => part( context, false ) ).join( '' ); }
  expandPartial( context = {} ) { return this.urlParts.map( part => part( context, true ) ).join( '' ); }
}
module.exports = ( templatedUrl ) => new UrlTemplate( templatedUrl );
