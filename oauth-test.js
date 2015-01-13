var restify           = require( 'restify' ),
    mongoose          = require( 'mongoose' ),
    passport          = require( 'passport' ),
    VKontakteStrategy = require( 'passport-vkontakte' ).Strategy,
    userProfile;

mongoose.connect( 'mongodb://localhost/test' );

var server = restify.createServer();
server.use( restify.queryParser() );

server.listen( 1515 );

server.use( passport.initialize() );


passport.use(
    new VKontakteStrategy(
        {
            clientID:      "4727212", // VK.com docs call it 'API ID'
            clientSecret:  "vJkxSwCYnioefOP7qZ1b",
            callbackURL:   "http://pc.wailorman.ru:1515/auth/vk/callback",
            profileFields: [ 'first_name', 'last_name', 'photo_max' ]
        },
        function ( accessToken, refreshToken, profile, next ) {

            console.log( '1 ' + accessToken );

            console.log( profile );

            console.log( profile.photo_max );

            userProfile = profile.displayName;

            return next( null, profile );

        }
    )
);


server.get( '/auth/vk', passport.authenticate( 'vkontakte', { session: false } ) );
server.get( '/auth/vk/callback', passport.authenticate( 'vkontakte', { session: false } ), function ( req, res, next ) {

    res.charSet('utf-8');

    res.send( 200, 'Success! Hello, ' + userProfile );
    return next();

} );