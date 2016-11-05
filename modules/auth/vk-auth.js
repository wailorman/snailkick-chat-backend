var mongoose          = require( 'mongoose' ),
    async             = require( 'async' ),
    restify           = require( 'restify' ),
    randToken         = require( 'rand-token' ),
    passport          = require( 'passport' ),
    VKontakteStrategy = require( 'passport-vkontakte' ).Strategy,
    sugar             = require( 'sugar' ),
    CookieParser      = require( 'restify-cookies' ),

    Client            = require( '../../objects/client/client.js' ),
    ClientModel       = require( '../../objects/client/client-model.js' ).ClientModel,

    receivedVkProfile,

    CLIENT_ID         = '4727212',
    CLIENT_SECRET     = 'vJkxSwCYnioefOP7qZ1b',
    LOGIN_PAGE_URL    = '/auth/vk',
    CALLBACK_URL      = '/auth/vk/callback',
    API_VERSION       = '5.27';


var getClientByVkProfile = function ( profile, next ) {

    var receivedDocument,
        resultClientObject;

    async.series( [

            // . Validate profile
            function ( scb ) {

                // id
                if ( !profile.id )
                    return scb( new restify.InvalidArgumentError( 'profile.id|invalid, can not be null' ) );

                scb();

            },

            // . Find in DB
            function ( scb ) {

                ClientModel.findOne( { "profile.vk.id": profile.id }, function ( err, doc ) {

                    if ( err ) return scb( new restify.InternalError( 'Find in DB. Mongo: ' + err.message ) );

                    if ( !doc ) { // not found -> create new Client

                        doc = new ClientModel();

                    }  // found -> update Client


                    // name

                    doc.name = ( profile.displayName ) ? profile.displayName : 'NoName ' + randToken.uid( 4 );


                    // avatar

                    if ( profile.photos ) {

                        if ( profile.photos[ 1 ] && profile.photos[ 1 ].value )
                            doc.avatar = profile.photos[ 1 ].value;

                        else if ( profile.photos[ 0 ] && profile.photos[ 0 ].value )
                            doc.avatar = profile.photos[ 0 ].value;

                        else
                            doc.avatar = null;

                    } else
                        doc.avatar = null;


                    // profile

                    doc.profile = { vk: profile };


                    doc.save( function ( err, doc ) {

                        if ( err ) return scb( new restify.InternalError( 'Save new client to DB. Mongo: ' + err.message ) );

                        receivedDocument = doc;

                        scb();

                    } );


                } );

            },

            // . Convert to Object
            function ( scb ) {

                resultClientObject = new Client();
                resultClientObject._documentToObject( receivedDocument, scb );

            }

        ],
        function ( err ) {

            if ( err ) return next( err );

            next( null, resultClientObject );

        }
    );

};

var authResultMiddleware = function ( req, res, next ) {

    var generatedClient, grantedToken;

    async.series( [

        // . Get Client by received Vk profile
        function ( scb ) {

            getClientByVkProfile( receivedVkProfile, function ( err, client ) {

                if ( err ) return scb( err );

                generatedClient = client;

                scb();

            } );

        },

        // . Attach token
        function ( scb ) {

            generatedClient.attachToken( function ( err, token ) {

                if ( err ) return scb( err );

                grantedToken = token;

                scb();

            } );

        },

        // . Write cookies and redirect
        function ( scb ) {

            var domain;
            domain = req.params.rto.split( '/' )[ 2 ];
            domain = domain.split( '.' );
            domain = domain[ domain.length - 2 ] + '.' + domain[ domain.length - 1 ];

            //console.log( 'domain: ' + domain );

            res.setCookie( 'token', grantedToken, {
                path:   '/',
                domain: domain,
                maxAge: 10
            } );

            /** @namespace req.params.rkey */
            var redirectTo = req.params.rto ? req.params.rto : 'https%3A%2F%2Fwailorman.github.io%2Fsnailkick-chat%2Fbuilt%2F';

            res.header( 'Location', redirectTo );
            res.send( 302 );

            scb();

        }

    ], next );

};


function passportHandler( req, res, next ) {

    var redirectUri, apiHost;

    if ( req.params.rto.match( /local/gi ) ) {
        apiHost = 'localhost:1515';
    } else {
        apiHost = 'snailkick-chat-backend.herokuapp.com';
    }

    /** @namespace req.params.rto */

    if ( req.params.rto ) {
        redirectUri = "http://" + apiHost + "/auth/vk/callback?rto=" + req.params.rto;
    } else {
        redirectUri = "http://" + apiHost + "/auth/vk/callback";
    }

    passport.use(
        new VKontakteStrategy(
            {
                clientID:      "4727212",
                clientSecret:  "vJkxSwCYnioefOP7qZ1b",
                callbackURL:   redirectUri,
                profileFields: [ 'first_name', 'last_name', 'photo_max' ]
            },
            function ( accessToken, refreshToken, profile, next ) {

                receivedVkProfile = profile;

                return next( null, profile );

            }
        )
    );

    passport.authenticate( 'vkontakte', { session: false } )( req, res, next );


}

module.exports.passportHandler = passportHandler;
module.exports.authResultMiddleware = authResultMiddleware;
module.exports.getClientByVkProfile = getClientByVkProfile;
