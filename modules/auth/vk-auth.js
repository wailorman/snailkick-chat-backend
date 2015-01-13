var mongoose          = require( 'mongoose' ),
    async             = require( 'async' ),
    restify           = require( 'restify' ),
    randToken         = require( 'rand-token' ),
    passport          = require( 'passport' ),
    VKontakteStrategy = require( 'passport-vkontakte' ).Strategy,
    sugar             = require( 'sugar' ),

    Client            = require( '../../classes/client/client.js' ),
    ClientModel       = require( '../../classes/client/client-model.js' ).ClientModel,


    CLIENT_ID         = '4727212',
    CLIENT_SECRET     = 'vJkxSwCYnioefOP7qZ1b',
    LOGIN_PAGE_URL    = '/auth/vk',
    CALLBACK_URL      = '/auth/vk/callback',
    API_VERSION       = '5.27';


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

var initiateVkAuth = function ( req, res, next ) {



};

module.exports.getClientByVkProfile = getClientByVkProfile;
