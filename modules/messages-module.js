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

                        if ( !docs || docs.length === 0 ) return scb();

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

            res.header( "Access-Control-Allow-Origin", "*" );
            res.send( 200, resultArrayOfMessages );

            return next();

        } );

};


var postMessage = function ( req, res, next ) {

    var text, client;

    async.series(
        [

            // . Prepare message
            function ( scb ) {

                if ( !req.params.text ) return scb( new restify.InvalidArgumentError( 'text|null' ) );

                text = req.params.text;

                return scb();

            },

            // . Check token and attach client
            function ( scb ) {

                if ( !req.header( 'token' ) ) return scb( new restify.InvalidArgumentError( 'Security error! You have not passed token to verify you' ) );

                client = new Client();

                client.findOne( { token: req.header( 'token' ) }, function ( err ) {

                    if ( err ) return scb( new restify.InternalError( 'Can\'t find Client with such token!' ) );

                    return scb();

                } );

            },

            // . Post a message
            function ( scb ) {

                var newMessage = new MessageModel();

                newMessage.client = new mf.ObjectId( client.id );

                newMessage.text = text;

                newMessage.posted = new Date();

                newMessage.save( function ( err ) {

                    if ( err ) return scb( new restify.InternalError( 'Post the message to db Mongo error: ' + err.message ) );

                    return scb();

                } );

            }

        ],
        function ( err ) {

            if ( err ) return next( err );

            res.header( "Access-Control-Allow-Origin", "*" );
            res.send( 200, 'Success! Message posted' );

            return next();

        }
    );

};

module.exports.findMessages = findMessages;
module.exports.postMessage = postMessage;