var mongoose     = require( 'mongoose' ),
    async        = require( 'async' ),
    restify      = require( 'restify' ),
    sugar        = require( 'sugar' ),
    mf           = require( '../libs/mini-funcs.js' ),

    MessageModel = require( '../objects/message/message-model.js' ).MessageModel,
    Message      = require( '../objects/message/message.js' ),
    Client       = require( '../objects/client/client.js' );

var defaultLimit = 100,
    maxLimit     = 1000;

/**
 *
 * @param req
 * @param [req.params]
 * @param [req.params.limit]
 * @param res
 * @param next
 */
var findMessages = function ( req, res, next ) {

    var limit, resultArrayOfMessages = [];

    async.series( [

            // . Prepare limit
            function ( scb ) {

                limit = req.params.limit ? req.params.limit : defaultLimit;

                if ( !req.params.limit ) return scb();

                if ( typeof req.params.limit === 'string' && !parseInt( req.params.limit ) ) return scb( new restify.InvalidArgumentError( 'limit|invalid' ) );

                if ( limit > maxLimit ) return scb( new restify.InvalidArgumentError( 'limit|greater than ' + maxLimit ) );

                scb();

            },

            // . Get messages
            function ( scb ) {

                MessageModel
                    .find()
                    .limit( limit )
                    .sort( { _id: -1 } )
                    .exec( function ( err, docs ) {

                        if ( err ) return scb( new restify.InternalError( 'Mongo error: ' + err.message ) );

                        if ( !docs ) return scb();

                        async.eachSeries(
                            docs,
                            function ( doc, ecb ) {

                                var theMessage = new Message();

                                theMessage._documentToObject( doc, function () {

                                    resultArrayOfMessages.push( theMessage );

                                    return ecb();

                                } );

                            },
                            function () {
                                return scb();
                            }
                        );

                    } );

            },

            // . Return
            function ( scb ) {

                return scb( null, resultArrayOfMessages );

            }

        ],

        function ( err ) {

            if ( err ) return next( err );

            res.send( 200, resultArrayOfMessages );

            return next();

        } );

};

var postMessage = function ( req, res, next ) {

    var text, sticker;

    async.series(
        [

            // . Prepare message
            function ( scb ) {

                text = req.params.text;
                sticker = req.params.sticker;

                if ( !( text || sticker ) ) return scb( new restify.InvalidArgumentError( "Text or sticker missing" ) );

                return scb();

            },

            // . Check client
            function ( scb ) {

                if ( !req.client.id ) return scb( new restify.InvalidArgumentError( 'Security error! You have not passed token to verify you' ) );
                if ( req.client.banned ) return scb( new restify.ForbiddenError( "You have been banned. You are not able to post messages" ) );

                return scb();

            },

            // . Post a message
            function ( scb ) {

                var newMessage = new MessageModel();

                newMessage.client = new mf.ObjectId( req.client.id );

                newMessage.text = text;
                newMessage.sticker = sticker;

                newMessage.posted = new Date();

                newMessage.save( function ( err ) {

                    if ( err ) return scb( new restify.InternalError( 'Post message to db. Mongo error: ' + err.message ) );

                    return scb();

                } );

            }

        ],
        function ( err ) {

            if ( err ) return next( err );

            res.send( 200, 'Success! Message posted' );

            return next();

        }
    );

};

var deleteMessage = function ( req, res, next ) {

    var messageId = req.params.id,
        client = req.client;

    async.series( [

        // check params passed
        function ( scb ) {

            if ( !messageId ) return scb( new restify.InvalidArgumentError( "Message id missing" ) );

            if ( !client ) return scb( new restify.ForbiddenError( "Token missing" ) );

            scb();

        },

        // check client statuses
        function ( scb ) {

            /** @namespace req.client.statuses.queen */
            var isClientAllowedToDeleteMessages = req.client.statuses &&
                                                  ( req.client.statuses.elf === true || req.client.statuses.king === true || req.client.statuses.queen === true );


            if ( isClientAllowedToDeleteMessages ) {
                return scb();
            } else {
                return scb( new restify.ForbiddenError( "You are not allowed to delete messages" ) );
            }

        },

        // find msg with this id and remove it
        function ( scb ) {

            MessageModel
                .findOne( { _id: new mf.ObjectId( messageId ) } )
                .exec( function ( err, doc ) {

                    if ( err ) return scb( new restify.InternalError( "Mongo find error: " + err ) );

                    if ( !doc ) return scb( new restify.ResourceNotFoundError( "Can't find message with such id" ) );

                    doc.remove( function ( err ) {

                        if ( err ) return scb( new restify.InternalError( "Mongo remove error: " + err ) );
                        res.send( 200 );

                        scb();

                    } );

                } );

        }

    ], next );

};

module.exports.deleteMessage = deleteMessage;
module.exports.findMessages = findMessages;
module.exports.postMessage = postMessage;