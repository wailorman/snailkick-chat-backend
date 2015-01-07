var mongoose     = require( 'mongoose' ),
    should       = require( 'should' ),
    async        = require( 'async' ),
    sugar        = require( 'sugar' ),
    mf           = require( '../../libs/mini-funcs.js' ),
    restify      = require( 'restify' ),

    ClientModel  = require( '../client/client-model.js' ).ClientModel,
    Client       = require( '../client/client.js' ),

    MessageModel = require( './message-model.js' ).MessageModel,

    defaultLimit = 1000;

var Message = function () {
};

Message.prototype._validators = {};

Message.prototype._validators.id = function ( value ) {
};

Message.prototype._validators.text = function ( value ) {

    return typeof value === 'string' && !value.isBlank();

};

Message.prototype._validators.client = function ( value, next ) {

    var testClient = new Client();

    if ( !value || !(value instanceof Client) || !value.id ) return next( new restify.InvalidArgumentError( 'client|invalid' ) );

    testClient.findOne( { id: value.id }, function ( err ) {

        if ( err ) return next( new restify.InvalidArgumentError( 'client|invalid error: ' + err.message ) );

        next();

    } );

};

/**
 *
 * @param document
 * @param next
 * @private
 */
Message.prototype._documentToObject = function ( document, next ) {

    var self = this;

    self.id = document._id.toString();
    self.text = document.text;

    self.posted = document.posted;

    self.client = new Client();

    self.client.findOne( { id: document.client.toString() }, function ( err ) {
        if ( err ) return next( new restify.InternalError( 'Document to object: attach client error: ' + err.message ) );

        next();
    } );

};


Message.prototype.clean = function () {

    var self = this;

    delete self.id;
    delete self.text;
    delete self.posted;
    delete self.client;

};


/**
 *
 * @param                   data
 * @param {string}          data.text
 * @param {Client|string}   data.client
 * @param {function}        next
 */
Message.prototype.post = function ( data, next ) {

    var self = this,
        receivedDocument;

    async.series( [

        // . Validate parameters
        function ( scb ) {

            if ( !data )
                return scb( new restify.InvalidArgumentError( 'data|invalid can not be null' ) );

            if ( !self._validators.text( data.text ) )
                return scb( new restify.InvalidArgumentError( 'text|invalid' ) );

            if ( !data.client )
                return scb( new restify.InvalidArgumentError( 'client|can not be null' ) );

            self._validators.client( data.client, scb );

        },

        // . Write to DB
        function ( scb ) {

            var newDocument = new MessageModel( {
                text:   data.text,
                client: new mf.ObjectId( data.client.id ),
                posted: new Date()
            } );

            newDocument.save( function ( err, doc ) {

                if ( err ) return scb( new restify.InternalError( 'Write to db. Mongo: ' + err.message ) );

                receivedDocument = doc;

                scb();

            } );

        },

        // . Convert received document to object
        function ( scb ) {

            self._documentToObject( receivedDocument, scb );

        }

    ], next );

};

Message.prototype.remove = function ( next ) {

    var self = this;

    async.series( [

        // . Find this message
        function ( scb ) {

            MessageModel.findOne( { _id: new mf.ObjectId( self.id ) }, function ( err, doc ) {

                if ( err ) return scb( new restify.InternalError( 'Mongo find: ' + err.message ) );

                if ( !doc ) return scb( new restify.ResourceNotFoundError( 'id|404' ) );

                scb();

            } );

        },

        // . Remove from db
        function ( scb ) {

            MessageModel.findOneAndRemove( { _id: new mf.ObjectId( self.id ) }, function ( err ) {

                if ( err ) return scb( new restify.InternalError( 'Mongo find and remove: ' + err.message ) );

                scb();

            } );

        },

        // . Clean object
        function ( scb ) {

            self.clean();
            scb();

        }

    ], next );

};


Array.prototype.findMessages = function ( filter, next ) {

    var limit, after, sort;

    async.series( [

        // . Validate and parse parameters
        function ( scb ) {

            // limit

            if ( !filter.limit ) {
                limit = defaultLimit;
            }

            if ( typeof filter.limit === 'string' && ( parseInt( filter.limit ) ) ) {

                limit = parseInt( filter.limit );

            } else if ( typeof filter.limit === 'number' ) {

                limit = filter.limit;

            } else
                return scb( new restify.InvalidArgumentError( 'limit|invalid' ) );



            // after

            if ( filter.after ) {



            }

        }

        // . Prepare query

        // . Find in DB

        // . Convert to objects

    ], next );

};

module.exports = Message;