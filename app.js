var restify           = require( 'restify' ),
    mongoose          = require( 'mongoose' ),
    passport          = require( 'passport' ),
    VKontakteStrategy = require( 'passport-vkontakte' ).Strategy;

//vkAuth = require( './modules/auth/vk-auth.js' );

mongoose.connect( 'mongodb://localhost/test' );

var server = restify.createServer();
server.use( restify.queryParser() );

server.listen( 1515 );

//var app = express();
//
//
//passport.serializeUser( function ( user, done ) {
//    done( null, user );
//} );
//
//passport.deserializeUser( function ( obj, done ) {
//    done( null, obj );
//} );
//



//
//app.get( '/auth/vk',
//    passport.authenticate( 'vkontakte' ) );
//
//// GET /auth/facebook/callback
////   Use passport.authenticate() as route middleware to authenticate the
////   request.  If authentication fails, the user will be redirected back to the
////   login page.  Otherwise, the primary route function function will be called,
////   which, in this example, will redirect the user to the home page.
//app.get( '/auth/vk/callback', function ( req, res, next ) {
//        passport.authenticate(
//            'vkontakte',
//            function ( err, token ) {
//
//                console.log( '2 ' + token );
//
//
//            }
//        );
//    }
//);


//passport.use(
//    new VKontakteStrategy(
//        {
//            clientID:     "4727212", // VK.com docs call it 'API ID'
//            clientSecret: "vJkxSwCYnioefOP7qZ1b",
//            callbackURL:  "http://pc.wailorman.ru:1515/auth/vk/callback"/*,
//         profileFields: [ 'first_name', 'last_name', 'photo_max' ]*/
//        },
//        function ( accessToken, refreshToken, profile, next ) {
//
//            console.log( '1 ' + accessToken );
//            next( null, profile );
//
//        }
//    )
//);


server.get( '/auth/vk',
    //passport.authenticate( 'vkontakte', {
    //    successRedirect: '/',
    //    failureRedirect: '/login'
    //} )
    function ( req, res, next ) {


        var lol = function ( req, res, next ) {
            res.send( 200, 'Hey!' );

            return next();

        };

        lol( req, res, next );

    }
);


server.get( '/auth/vk/callback', function ( req, res, next ) {
        //function ( req, res, next ) {
        //
        //    console.log( req );
        //
        //}
        passport.authenticate(
            'vkontakte',
            function ( err, user, info ) {
                if ( err ) {
                    return next( err );
                }
                if ( !user ) {
                    return res.redirect( '/login' );
                }
                req.logIn( user, function ( err ) {
                    if ( err ) {
                        return next( err );
                    }
                    return res.redirect( '/users/' + user.username );
                } );
            }
        );

    }
);

//app.listen( 1515 );