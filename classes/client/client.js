var mongoose    = require( 'mongoose' ),
    should      = require( 'should' ),
    async       = require( 'async' ),
    sugar       = require( 'sugar' ),
    mf          = require( '../../libs/mini-funcs.js' ),
    restify     = require( 'restify' ),

    ClientModel = require( './client-model.js' ).ClientModel;


/* TODO Add a key property to the object which will random-generated */


/**
 *
 * Construct a new Client
 *
 * @class Client
 *
 * @property { string } id
 * @property { string } name
 * @property { string } avatarUrl
 * @property { string } profileUrl
 * @property { string } provider
 *
 * @constructor
 */
var Client = function () {
};


Client.prototype._documentToObject = function ( document, next ) {

    var self = this;

    self.id = document._id.toString();

    self.name = document.name;

    if ( document.avatarUrl ) self.avatarUrl = document.avatarUrl;

    if ( document.profileUrl ) self.profileUrl = document.profileUrl;

    if ( document.provider ) self.provider = document.provider;

    next();

};


Client.prototype._validators = {

    id: function ( value ) {

        return mf.isObjectId( value );

    },

    name: function ( value ) {

        return typeof value === 'string';

    },

    url: function ( value ) {

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
    delete self.avatarUrl;
    delete self.profileUrl;
    delete self.provider;

};


// TODO Add .ban() method

/**
 * Create new Client
 *
 * @param               data
 * @param {string}      data.name
 * @param {string}      [data.avatarUrl]
 * @param {string}      [data.profileUrl]
 * @param {string}      [data.provider]
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

                if ( data.avatarUrl && !self._validators.url( data.avatarUrl ) )
                    return scb( new restify.InvalidArgumentError( 'avatarUrl|invalid' ) );

                if ( data.profileUrl && !self._validators.url( data.profileUrl ) )
                    return scb( new restify.InvalidArgumentError( 'profileUrl|invalid' ) );

                if ( data.provider && !self._validators.provider( data.provider ) )
                    return scb( new restify.InvalidArgumentError( 'provider|invalid' ) );

                scb();

            },

            // . Create document and write to DB
            function ( scb ) {

                var dataForWrite = {};

                dataForWrite.name = data.name;

                if ( data.avatarUrl )   dataForWrite.avatarUrl = data.avatarUrl;
                if ( data.profileUrl )  dataForWrite.profileUrl = data.profileUrl;
                if ( data.provider )    dataForWrite.provider = data.provider;

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
 * @todo Find by key. But not together with id
 *
 * @param               filter          Should be not null
 * @param {string}      filter.id
 * @param {function}    next
 */
Client.prototype.findOne = function ( filter, next ) {

    var self = this,
        receivedDocument;

    async.series(
        [

            // . Validate parameters
            function ( scb ) {

                if ( !filter )
                    return scb( new restify.InvalidArgumentError( 'filter can not be null' ) );


                if ( !self._validators.id( filter.id ) )
                    return scb( new restify.InvalidArgumentError( 'id|invalid' ) );


                scb();

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