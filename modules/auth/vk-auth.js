var mongoose          = require( 'mongoose' ),
    async             = require( 'async' ),
    restify           = require( 'restify' ),
    randToken         = require( 'rand-token' ),
    passport          = require( 'passport' ),
    VKontakteStrategy = require( 'passport-vkontakte' ).Strategy,

    Client            = require( '../../classes/client/client.js' ),
    ClientModel       = require( '../../classes/client/client-model.js' ).ClientModel;


var getClientByVkProfile = function ( profile, next ) {

    var defaultParams = {},
        receivedDocument,
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

                        var newClientDocument = new ClientModel( {

                            name: ( profile.first_name && profile.last_name ) ?
                            profile.first_name + ' ' + profile.last_name : 'NoName ' + randToken.uid( 4 ),

                            avatar: profile.photo_max ? profile.photo_max : null,

                            profile: { vk: profile }

                        } );

                        newClientDocument.save( function ( err, doc ) {

                            if ( err ) return scb( new restify.InternalError( 'Save new client to DB. Mongo: ' + err.message ) );

                            receivedDocument = doc;

                            scb();

                        } );

                    } else { // found -> update Client

                        doc.name = ( profile.first_name && profile.last_name ) ?
                        profile.first_name + ' ' + profile.last_name : 'NoName ' + randToken.uid( 4 );

                        doc.avatar = profile.photo_max ? profile.photo_max : null;

                        doc.profile.vk = profile;

                        doc.save( function ( err, doc ) {

                            if ( err ) return scb( new restify.InternalError( 'Save new client to DB. Mongo: ' + err.message ) );

                            receivedDocument = doc;

                            scb();

                        } );

                    }

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


/*passport.use( new VKontakteStrategy( {
        clientID:      "", // VK.com docs call it 'API ID'
        clientSecret:  "",
        callbackURL:   "http://localhost:3000/auth/vkontakte/callback",
        profileFields: [ 'first_name', 'last_name', 'photo_max' ]
    },
    function ( accessToken, refreshToken, profile, done ) {
        User.findOrCreate( { vkontakteId: profile.id }, function ( err, user ) {
            return done( err, user );
        } );
    }
) );*/


var authInterface = function ( req, res, next ) {
};

var authCallbackInterface = function ( req, res, next ) {
};

module.exports.getClientByVkProfile = getClientByVkProfile;
module.exports.authInterface = authInterface;
module.exports.authCallbackInterface = authCallbackInterface;