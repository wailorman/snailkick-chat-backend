var mongoose    = require( 'mongoose' ),
    should      = require( 'should' ),
    async       = require( 'async' ),
    sugar       = require( 'sugar' ),
    mf          = require( '../../libs/mini-funcs.js' ),
    restify     = require( 'restify' ),
    randToken   = require( 'rand-token' ),

    ClientModel = require( './client-model.js' ).ClientModel,
    TokenModel  = require( './token-model.js' ).TokenModel,

    self;


/* TODO Add a key property to the object which will random-generated */


/**
 *
 * Construct a new Client
 *
 * @class Client
 *
 * @property { string } id
 * @property { string } name
 * @property { string } avatar
 * @property { string } profileUrl
 * @property { string } provider
 *
 * @constructor
 */
var Client = function () {
    self = this;
};


Client.prototype._documentToObject = function ( document, next ) {

    var self = this;

    self.id = document._id.toString();

    self.name = document.name;

    if ( document.avatar ) self.avatar = document.avatar;

    if ( document.profile ) self.profile = document.profile;

    if ( document.statuses ) self.statuses = document.statuses;

    if ( document.banned ) self.banned = document.banned;

    next();

};


Client.prototype._validators = {

    id: function ( value ) {

        return mf.isObjectId( value );

    },

    name: function ( value ) {

        return typeof value === 'string';

    },

    // TODO
    url:  function ( value ) {

        return typeof value === 'string';

    },

    provider: function ( value ) {

        return typeof value === 'string';

    }

};

Client.prototype.clean = function () {

    var self = this;

    delete self.id;
    delete self.name;
    delete self.avatar;
    delete self.profileUrl;
    delete self.provider;

};


// TODO Add .ban() method

/**
 * Create new Client
 *
 * @param               data
 * @param {string}      data.name
 * @param {string}      [data.avatar]
 * @param {Object}      [data.profile]
 * @param {function}    next
 */
Client.prototype.create = function ( data, next ) {

    var self = this,
        receivedDocument;

    async.series(
        [

            // . Validate parameters
            function ( scb ) {

                if ( !data )
                    return scb( new restify.InvalidArgumentError( 'data|invalid' ) );

                if ( !self._validators.name( data.name ) )
                    return scb( new restify.InvalidArgumentError( 'name|invalid' ) );

                if ( data.avatar && !self._validators.url( data.avatar ) )
                    return scb( new restify.InvalidArgumentError( 'avatar|invalid' ) );

                scb();

            },

            // . Create document and write to DB
            function ( scb ) {

                var dataForWrite = {};

                dataForWrite.name = data.name;

                if ( data.avatar )   dataForWrite.avatar = data.avatar;
                if ( data.profile )  dataForWrite.profile = data.profile;
                if ( data.statuses )  dataForWrite.statuses = data.statuses;

                var newDocument = new ClientModel( dataForWrite );

                newDocument.save( function ( err, doc ) {


                    if ( err ) return scb( new restify.InternalError( 'Mongo: ' + err.message ) );

                    receivedDocument = doc;

                    scb();

                } );

            },

            // . Convert received document to object
            function ( scb ) {

                self._documentToObject( receivedDocument, function ( err ) {

                    if ( err ) return scb( new restify.InternalError( 'Document to object error: ' + err.message ) );

                    scb();

                } );

            }

        ],
        next
    );

};

Client.prototype.attachToken = function ( next ) {

    var generatedToken,
        self = this;

    async.series( [

        // . Validate Client
        function ( scb ) {

            var validateClient = new Client();

            validateClient.findOne( { id: self.id }, function ( err ) {

                if ( err && err instanceof restify.ResourceNotFoundError )
                    return scb( new restify.InvalidArgumentError( 'this client does not exist' ) );

                if ( err )
                    return scb( new restify.InternalError( 'Validate Client: ' + err.message ) );

                scb();

            } );

        },

        // . Generate token
        function ( scb ) {

            generatedToken = randToken.generate( 20 );
            scb();

        },

        // . Write token to DB
        function ( scb ) {

            var newTokenDocument = new TokenModel( {

                token:  generatedToken,
                client: new mf.ObjectId( self.id )

            } );

            newTokenDocument.save( function ( err ) {

                if ( err ) return scb( new restify.InternalError( 'Write token to DB. Mongo: ' + err.message ) );

                scb();

            } );

        }

    ], function ( err ) {

        return next(
            err,
            generatedToken
        );

    } );

};

/**
 * Remove Client from database
 *
 * @param next
 */
Client.prototype.remove = function ( next ) {

    var self = this;

    if ( !self.id ) return next( new restify.InvalidArgumentError( 'self.id - undefined' ) );

    async.series(
        [

            // . Find Client for removing
            function ( scb ) {

                var testClient = new Client();

                testClient.findOne( { id: self.id }, function ( err ) {

                    scb( err );

                } );

            },

            // . Find and remove client from DB
            function ( scb ) {

                ClientModel.findOneAndRemove(
                    { _id: new mf.ObjectId( self.id ) },
                    function ( err ) {

                        if ( err ) return scb( new restify.InternalError( 'Find and remove Client from DB error. Mongo: ' + err.message ) );

                        scb();

                    }
                );

            },

            // . Clean object
            function ( scb ) {

                self.clean();
                scb();

            }

        ],
        next
    );

};

/**
 * Find one Client
 *
 * @param               filter          Should be not null
 * @param {string}      [filter.id]
 * @param {string}      [filter.token]
 * @param {function}    next
 */
Client.prototype.findOne = function ( filter, next ) {

    var receivedDocument,
        self = this;

    async.series(
        [

            // . Validate parameters
            function ( scb ) {

                if ( !filter )
                    return scb( new restify.InvalidArgumentError( 'filter can not be null' ) );

                if ( filter.token && ( typeof filter.token !== 'string' || mf.isToken( filter.token ) == false ) )
                    return scb( new restify.InvalidArgumentError( 'token|invalid' ) );

                if ( filter.id && ( typeof filter.id !== 'string' || mf.isObjectId( filter.id ) == false ) )
                    return scb( new restify.InvalidArgumentError( 'id|invalid' ) );


                scb();

            },

            // . Prepare token
            function ( scb ) {

                if ( !filter.token ) return scb();

                TokenModel.findOne( { token: filter.token }, function ( err, doc ) {

                    if ( err ) return scb( new restify.InternalError( 'Prepare token. Mongo: ' + err.message ) );

                    if ( !doc ) return scb( new restify.ResourceNotFoundError( 'token is not found' ) );

                    filter.id = doc.client.toString();

                    scb();

                } );

            },

            // . Find in DB
            function ( scb ) {

                ClientModel.findOne( { _id: new mf.ObjectId( filter.id ) }, function ( err, doc ) {

                    if ( err ) return scb( new restify.InternalError( 'Mongo: ' + err.message ) );
                    if ( !doc ) return scb( new restify.ResourceNotFoundError( '404' ) );

                    receivedDocument = doc;

                    scb();

                } );

            },

            // . Convert to object
            function ( scb ) {

                self._documentToObject( receivedDocument, scb );

            }

        ],
        next
    );

};


/**
 * Find several Clients by filter
 *
 * @todo Finish .findClients
 *
 * @param               filter              Can be null
 * @param {string}      [filter.id]
 * @param {string}      [filter.name]
 * @param {string}      [filter.provider]
 * @param {int|string}  [filter.limit]
 * @param {function}    next
 */
Array.prototype.findClients = function ( filter, next ) {
};


module.exports = Client;