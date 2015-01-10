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
 * @param filter.after
 * @param next
 */
Array.prototype.findMessages = function ( filter, next ) {

    var arrayInstance = this,

        limit, after, sort,
        query = {},
        receivedDocuments;

    async.series( [

        // . Validate and parse parameters
        function ( scb ) {

            async.series( [

                // limit
                function ( vscb ) {

                    if ( !filter.limit ) {
                        limit = defaultLimit;
                        return vscb();
                    }

                    if ( typeof filter.limit !== 'string' && typeof filter.limit !== 'number' )
                        return vscb( new restify.InvalidArgumentError( 'filter.limit|invalid' ) );

                    if ( typeof filter.limit === 'string' ) {

                        if ( parseInt( filter.limit ) )
                            filter.limit = parseInt( filter.limit );
                        else
                            return vscb( new restify.InvalidArgumentError( 'filter.limit|invalid string number' ) );

                    }

                    if ( filter.limit > maxLimit )
                        return vscb( new restify.InvalidArgumentError( 'filter.limit|invalid. should be less or equal ' + maxLimit ) );

                    limit = filter.limit;

                    vscb();

                },

                // after
                function ( vscb ) {

                    if ( !filter.after ) {
                        return vscb();
                    }

                    if ( !mf.isObjectId( filter.after ) )
                        return vscb( new restify.InvalidArgumentError( 'filter.after|invalid. should be an ObjectId' ) );

                    after = filter.after;

                    vscb();
                },

                // sort
                function ( vscb ) {

                    // limit positive - find last
                    // limit negative - find first

                    //sort = { _id: limit > 0 ? -1 : 1 };

                    sort = { _id: 1 };

                    vscb();

                }

            ], scb );

        },

        // . Prepare query
        function ( scb ) {

            query = after ? { _id: { $gt: new mf.ObjectId( after ) } } : {};
            scb();

        },

        // . Find in DB
        function ( scb ) {

            console.log( 'query: ' + JSON.stringify( query ) +
                         ' limit: ' + limit +
                         ' sort: ' + JSON.stringify( sort ) );

            MessageModel.find( query ).limit( limit ).sort( sort ).exec( function ( err, docs ) {

                if ( err ) return scb( new restify.InternalError( 'Find in DB: Mongo error: ' + err.message ) );

                receivedDocuments = docs.reverse();

                scb();

            } );

        },

        // . Convert to objects
        function ( scb ) {

            if ( receivedDocuments.length === 0 )
                return scb();


            async.each(
                receivedDocuments,
                function ( document, ecb ) {

                    var messageToPushToResultArray = new Message();

                    messageToPushToResultArray._documentToObject( document, function ( err ) {
                        if ( err ) return ecb( new restify.InternalError( 'Documents to object converting error: ' + err.message ) );

                        arrayInstance.push( messageToPushToResultArray );

                        ecb();

                    } );

                },
                scb
            );

        }

    ], next );

};

module.exports = Message;