var restify           = require( 'restify' ),
    mongoose          = require( 'mongoose' ),
    passport          = require( 'passport' ),
    VKontakteStrategy = require( 'passport-vkontakte' ).Strategy,
    CookieParser      = require( 'restify-cookies' ),

    userProfile,

    vkAuth            = require( './modules/auth/vk-auth.js' ),
    MessagesModule    = require( './modules/messages-module.js' ),
    ClientsModule     = require( './modules/clients-module.js' ),
    KingOnline        = require( './modules/king-online.js' );

/*

 docker kill mongo || true  && \
 docker rm mongo || true && \
 docker run -d --name mongo -p 27017:27017 mongo:latest --smallfiles --noprealloc && \
 \
 docker kill snail-back || true && \
 docker rm snail-back || true && \
 docker run -d --name snail-back --link mongo:mongo.local -p 1515:1515 wailorman/snailkick-chat-backend:dev

 */

var mongoHost;

/** @namespace process.env.MONGO_HOST */
if ( process.env.MONGO_HOST ) {
    mongoHost = 'mongodb://' + process.env.MONGO_HOST + '/snailkick-chat';
} else {
    mongoHost = 'mongodb://mongo.local/snailkick-chat';
}

console.log( 'Connecting to MongoDB server: ' + mongoHost );

mongoose.connect( mongoHost );

var server = restify.createServer();

server.use( restify.queryParser() );
server.use( restify.bodyParser() );
server.use( restify.fullResponse() );
server.use( restify.CORS() );

server.use( KingOnline.middleware() );
server.use( ClientsModule.attachClientToRequest );

server.use( passport.initialize() );

server.use( CookieParser.parse );

server.use( function ( req, res, next ) {

    res.charSet( 'utf-8' );
    return next();

} );

server.get( '/messages', MessagesModule.findMessages );
server.post( '/messages', MessagesModule.postMessage );
server.del( '/messages/:id', MessagesModule.deleteMessage );

server.get( '/clients/:id', ClientsModule.getClient );

server.get( '/auth/vk', vkAuth.passportHandler );
server.get( '/auth/vk/callback', vkAuth.passportHandler, vkAuth.authResultMiddleware );

server.get( '/is-king-online', KingOnline.isKingOnline );

server.listen( 1515, function () {
    console.log( 'Server started!' );
} );

process.on( 'uncaughtException', function ( error ) {
    console.log( error.stack );
} );