var mongoose     = require( 'mongoose' ),
    async        = require( 'async' ),
    restify      = require( 'restify' ),
    sugar        = require( 'sugar' ),

    MessageModel = require( '../classes/message/message-model.js' ).MessageModel,
    Message      = require( '../classes/message/message.js' );

var defaultLimit = 100,
    maxLimit     = 1000;

var findMessages = function ( req, res, next ) {

    var limit, resultArrayOfMessages = [];

    async.series( [

            // . Prepare limit
            function ( scb ) {

                if ( typeof req.params.limit === 'string' && ! parseInt( req.params.limit ) ) return scb( new restify.InvalidArgumentError( 'limit|invalid' ) );

                limit = req.params.limit ? req.params.limit : defaultLimit;

                if ( limit > maxLimit ) return scb( new restify.InvalidArgumentError( 'limit|greater than ' + maxLimit ) );

                scb();

            },

            // . Get messages
            function ( scb ) {

                MessageModel
                    .find()
                    .limit( limit )
                    .sort( { _id: - 1 } )
                    .exec( function ( err, docs ) {

                        if ( err ) return scb( new restify.InternalError( 'Mongo error: ' + err.message ) );

                        if ( ! docs || docs.length === 0 ) return scb();

                        async.each(
                            docs,
                            function ( doc, ecb ) {

                                var theMessage = new Message();

                                theMessage._documentToObject( doc, function () {

                                    resultArrayOfMessages.push( theMessage );

                                    return ecb();

                                } );

                            }
                        );

                    } );

            },

            // . Return
            function ( scb ) {

                return scb( null, resultArrayOfMessages );

            }

        ],

        function ( err, resultArray ) {

            if ( err ) return next( err );

            res.send( 200, resultArray );

            return next();

        } );

};

var postMessage = function ( req, res, next ) {

    async.series(
        [

            // . Prepare message
            function ( scb ) {}

            // . Post a message

            // . Return

        ]
    );

};

module.exports.findMessages = findMessages;
module.exports.postMessage = postMessage;