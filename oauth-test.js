var restify           = require( 'restify' ),
    mongoose          = require( 'mongoose' ),
    passport          = require( 'passport' ),
    VKontakteStrategy = require( 'passport-vkontakte' ).Strategy,
    CookieParser      = require( 'restify-cookies' ),

    userProfile,

    vkAuth            = require( './modules/auth/vk-auth.js' ),
    messagesModule    = require( './modules/messagesModule.js' );

mongoose.connect( 'mongodb://localhost/test' );

var server = restify.createServer();

server.use( restify.queryParser() );
server.use( restify.bodyParser() );

server.use( passport.initialize() );

server.use( CookieParser.parse );

server.use( function ( req, res, next ) {

    res.charSet( 'utf-8' );
    return next();

} );

server.get( '/messages', messagesModule.findMessages );
server.post( '/messages', messagesModule.postMessage );

server.get( '/auth/vk', vkAuth.passportHandler );
server.get( '/auth/vk/callback', vkAuth.passportHandler, vkAuth.authResultMiddleware );

server.listen( 1515, function () {
    console.log( 'Server started!' );
} );
