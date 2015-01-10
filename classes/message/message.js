var mongoose     = require( 'mongoose' ),
    should       = require( 'should' ),
    async        = require( 'async' ),
    sugar        = require( 'sugar' ),
    mf           = require( '../../libs/mini-funcs.js' ),
    restify      = require( 'restify' ),

    ClientModel  = require( '../client/client-model.js' ).ClientModel,
    Client       = require( '../client/client.js' ),

    MessageModel = require( './message-model.js' ).MessageModel,

    defaultLimit = 100,

    maxLimit     = 1000;

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
                return scb( new restify.InvalidArgumentError( 'data|invalid. can not be null' ) );

            if ( !self._validators.text( data.text ) )
                return scb( new restify.InvalidArgumentError( 'data.text|invalid' ) );

            if ( !data.client )
                return scb( new restify.InvalidArgumentError( 'data.client|invalid. can not be null' ) );

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

/**
 *
 * @param filter
 * @param filter.limit
 * @param filter.last
 * @param next
 */
Array.prototype.findMessages = function ( filter, next ) {

    var arrayInstance = this,

        emptyResult = null,

        limit, after, sort,
        query = {},
        receivedDocuments;

    async.series( [

        // . Validate filter
        function ( scb ) {

            if ( !filter ) return scb();


            if ( filter.last && !mf.isObjectId( filter.last ) )
                return scb( new restify.InvalidArgumentError( 'last|invalid' ) );


            if ( filter.limit ) {

                if ( typeof filter.limit === 'string' && parseInt( filter.limit ) ) {

                    filter.limit = parseInt( filter.limit );

                } else if ( typeof filter.limit === 'string' )
                    return scb( new restify.InvalidArgumentError( 'limit|invalid string number' ) );


                if ( filter.limit > 1000 ) return scb( new restify.InvalidArgumentError( 'limit|too big' ) );


            } else
                filter.limit = defaultLimit;

            scb();

        },

        // . Check last
        function ( scb ) {

            MessageModel
                .find()
                .sort( { _id: -1 } )
                .limit( 1 )
                .exec( function ( err, docs ) {

                    if ( err ) return scb( new restify.InternalError( 'Check last. Mongo: ' + err.message ) );

                    if ( docs.length == 0 ) {

                        // No ANY messages

                        emptyResult = true;
                        return scb();

                    }

                    if ( filter.last && filter.last === docs[ 0 ]._id.toString() ) {

                        // Passed last message is equal to the last message in DB

                        emptyResult = true;
                        return scb();

                    }

                    emptyResult = false;
                    scb();

                } );


        },

        // . Request to DB
        function ( scb ) {

            if ( emptyResult ) return scb();

            MessageModel
                .find()
                .sort( { _id: -1 } )
                .limit( filter.limit )
                .exec( function ( err, docs ) {

                    if ( err ) return scb( new restify.InvalidArgumentError( 'Request to DB. Mongo: ' + err.message ) );

                    if ( docs.length === 0 ) {

                        emptyResult = true;
                        return scb();

                    }

                    receivedDocuments = docs;

                    scb();

                } );

        },

        // . Convert documents
        function ( scb ) {

            if ( emptyResult ) return scb();

            async.each(
                receivedDocuments,
                function ( document, ecb ) {

                    var messageToPush = {
                        id:       document._id.toString(),
                        text:     document.text,
                        clientId: document.client.toString()
                    };

                    arrayInstance.push( messageToPush );

                    ecb();

                }, scb
            );

        }

    ], next );

};

module.exports = Message;