require( '@jrapp/node-project-setup' ).testing.file( './test/file' )( ( urlTemplating ) => {} )
	.it( 'should expand a templated url', ( assert, urlTemplating ) => {
		assert.equal( urlTemplating( '/{r1}/test{?q1,q2}' ).expand( { r1: 'v1', q1: 'v2', q2: 'v3' } ), '/v1/test?q1=v2&q2=v3' );
	} )
	.it( 'should', ( assert, urlTemplating ) => {
		console.log( urlTemplating( '/{r1}/test/{+tery}/{a,b}/{a.b}/frewfwf/{?q1,q2}&d=5' ).parsed );
	} )
	.done();
