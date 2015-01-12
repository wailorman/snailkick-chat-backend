var restify = require( 'restify' ),

    vkAuth = require( './modules/auth/vk-auth.js' );

var server = restify.createServer( {
    name: 'snailkick-chat-backend'
} );

server.listen( 1515, function(){

    console.log( 'snailkick-chat-backend started on port 1515' );

} );

server.get( '/auth/vk' );
server.get( '/auth/vk/callback', vkAuth.authCallbackInterface );