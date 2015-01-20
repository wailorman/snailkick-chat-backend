var restify           = require( 'restify' ),
    mongoose          = require( 'mongoose' ),
    passport          = require( 'passport' ),
    VKontakteStrategy = require( 'passport-vkontakte' ).Strategy;

//vkAuth = require( './modules/auth/vk-auth.js' );

mongoose.connect( 'mongodb://localhost/test' );

var server = restify.createServer();
server.use( restify.queryParser() );

server.listen( 1515 );



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