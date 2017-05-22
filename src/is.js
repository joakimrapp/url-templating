const is = {
	defined: ( value ) => ( value !== undefined ) && ( value !== null ),
	undefined: ( value ) => ( value === undefined ) || ( value === null ) || ( value.toString().length === 0 ),
	validPrimitiveType: ( value ) => {
    switch( typeof( value ) ) {
      case 'string' :
      case 'number' :
      case 'boolean' :
        return true;
			default:
				return false;
    }
  },
	operator: ( operator ) => {
		switch( operator ) {
			case '+' :
			case '#' :
			case '.' :
			case '/' :
			case ';' :
			case '?' :
			case '&' :
				return true;
			default:
				return false;
		}
	},
	keyOperator: ( operator ) => {
		switch( operator ) {
			case ';' :
			case '&' :
			case '?' :
				return true;
			default:
				return false;
		}
	},
	reservedOperator: ( operator ) => {
		switch( operator ) {
			case '+' :
			case '#' :
				return true;
			default:
				return false;
		}
	}
};
module.exports = is;
