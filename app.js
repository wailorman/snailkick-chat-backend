var restify = require( 'restify' );

var server = restify.createServer( {
    name: 'snailkick-chat-backend'
} );

server.listen( 1515, function(){

    console.log( 'snailkick-chat-backend started on port 1515' );

} );