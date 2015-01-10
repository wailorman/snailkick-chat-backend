var mongoose     = require( 'mongoose' ),
    should       = require( 'should' ),
    async        = require( 'async' ),
    sugar        = require( 'sugar' ),
    restify      = require( 'restify' ),

    Message      = require( '../../../classes/message/message.js' ),
    MessageModel = require( '../../../classes/message/message-model.js' ).MessageModel,

    ClientModel  = require( '../../../classes/client/client-model.js' ).ClientModel,
    Client       = require( '../../../classes/client/client.js' );


var theNewMessage,
    theNewMessageArguments = {
        text:   'Hey ya!',
        client: theNewClient
    },

    theNewMessagesArray    = [],
    generatedMessagesArray = [],

    theNewClient,
    theNewClientArguments  = {
        name:     'The Client',
        provider: 'vk'
    };

var cleanUp = {
    messages: function ( next ) {

        MessageModel.find().remove().exec( next );

    }
};

var testCreate = {

    Client:  function ( next ) {

        theNewClient = new Client();

        theNewClient.create( theNewClientArguments, function ( err ) {

            should.not.exist( err );
            next();

        } );

    },
    Message: function ( next ) {

        testCreate.Client( function () {

            theNewMessage = new Message();

            theNewMessage.post( { text: 'Hey ya ya', client: theNewClient }, function ( err ) {

                should.not.exist( err );
                next();

            } );

        } );

    }

};

var testTemplates = {

    post: {

        shouldPost: function ( data, next ) {

            theNewMessage = new Message();

            theNewMessage.post( data, function ( err ) {

                should.not.exist( err );

                theNewMessage.id.should.be.type( 'string' );

                theNewMessage.text.should.be.type( 'string' );

                theNewMessage.client.should.be.instanceof( Client );

                theNewMessage.posted.should.be.instanceof( Date );

                next();

            } );

        },

        shouldReturnError: function ( data, next ) {

            theNewMessage = new Message();

            theNewMessage.post( data, function ( err ) {

                should.exist( err );

                next();

            } );

        }

    },

    remove: {

        shouldRemove: function ( next ) {

            theNewMessage.remove( function ( err ) {

                should.not.exist( err );
                next();

            } );

        },

        shouldReturnError: function ( next ) {

            theNewMessage.remove( function ( err ) {

                should.exist( err );
                next();

            } );

        }

    },

    /**
     *
     * @param numOfMessages
     * @param client
     * @param next
     */
    generateMessages: function ( numOfMessages, client, next ) {

        generatedMessagesArray = [];

        cleanUp.messages( function(){

            async.times(
                numOfMessages,
                function ( n, tcb ) {

                    var theMessage = new Message();

                    theMessage.post(
                        {
                            text:   'hey' + n,
                            client: client
                        },
                        function ( err ) {

                            should.not.exist( err );

                            generatedMessagesArray.push( theMessage );

                            tcb();

                        }
                    );

                },
                next
            );

        } );

    },

    findMessages: {

        /**
         *
         * @param filter
         *
         * @param {number}  [filter.generate]
         * @param {number}  [filter.length]
         * @param {Array}   [filter.numbersOfMessagesToRemove]
         * @param {number}  [filter.limit]
         * @param {number}  [filter.after]
         * @param {number}  [filter.textOfFirst]
         * @param {number}  [filter.textOfLast]
         *
         * @param next
         */
        shouldFind: function ( filter, next ) {

            var query;

            async.series( [

                // . Generate and prepare
                function ( scb ) {

                    testTemplates.generateMessages( filter.generate, theNewClient, scb );

                },

                // . Prepare
                function ( scb ) {

                    query = {};

                    if ( filter.after )
                        query.after = generatedMessagesArray[ filter.after ].id;

                    if ( filter.limit )
                        query.limit = filter.limit;

                    scb();

                },

                // . Remove
                function ( scb ) {

                    if ( filter.numbersOfMessagesToRemove ) {

                        async.each(
                            filter.numbersOfMessagesToRemove,

                            function ( numberOfMessage, ecb ) {

                                generatedMessagesArray[ numberOfMessage ].remove( ecb );

                            },

                            scb
                        );

                    } else
                        scb();

                },

                // . Request and check
                function ( scb ) {


                    theNewMessagesArray = [];
                    theNewMessagesArray.findMessages( query, function ( err ) {

                        should.not.exist( err );

                        if ( filter.length )
                            theNewMessagesArray.length.should.eql( filter.length );

                        if ( filter.textOfFirst && filter.length > 0 )
                            theNewMessagesArray[ 0 ].text.should.eql( 'hey' + filter.textOfFirst );

                        if ( filter.textOfLast && filter.length > 1 )
                            theNewMessagesArray[ filter.length - 1 ].text.should.eql( 'hey' + filter.textOfLast );


                        scb();

                    } );

                }

            ], next );
        },

        shouldReturnError: function ( filter, next ) {

            theNewMessagesArray = [];
            theNewMessagesArray.findMessages( filter, function ( err ) {

                should.exist( err );
                next();

            } );

        }

    }

};


describe( 'Message class', function () {

    before( function ( done ) {

        // Connecting to mongoose test database

        mongoose.connect( 'mongodb://localhost/test', {},
            function ( err ) {
                should.not.exist( err );
                done();
            } );
    } );

    describe( '.post()', function () {

        it( 'should post a message', function ( done ) {

            async.series( [

                function ( scb ) {

                    testCreate.Client( scb );

                },
                function ( scb ) {

                    testTemplates.post.shouldPost( { text: 'Some awesome text', client: theNewClient }, scb );

                }

            ], done );


        } );

        describe( 'should not post a message', function () {

            it( 'with null data', function ( done ) {

                testTemplates.post.shouldReturnError( null, done );

            } );

            it( 'with empty text', function ( done ) {

                testTemplates.post.shouldReturnError( { text: '   ' }, done );

            } );

            it( 'with empty client', function ( done ) {

                testTemplates.post.shouldReturnError( { client: null }, done );

            } );

            it( 'with nonexistent client', function ( done ) {

                theNewClient = new Client();

                theNewClient.id = '000000000000000000000000';

                testTemplates.post.shouldReturnError( { client: theNewClient }, done );

            } );

            it( 'with removed client', function ( done ) {

                var removedClient;

                async.series( [

                    // create client
                    function ( scb ) {

                        testCreate.Client( function () {

                            removedClient = theNewClient;
                            scb();

                        } );

                    },

                    // remove client
                    function ( scb ) {

                        theNewClient.remove( scb );

                    },

                    // try to post message
                    function ( scb ) {

                        testTemplates.post.shouldReturnError( { text: 'hey ya', client: removedClient }, scb );

                    }

                ], done );

            } );

            // TODO should not post a message by banned client

        } );

    } );

    describe( '.remove()', function () {

        beforeEach( function ( done ) {

            testCreate.Message( done );

        } );

        it( 'should remove message', function ( done ) {

            testTemplates.remove.shouldRemove( done );

        } );

        it( 'should not remove already removed message', function ( done ) {

            testTemplates.remove.shouldRemove( function () {

                testTemplates.remove.shouldReturnError( done );

            } );

        } );

        it( 'should not remove nonexistent message', function ( done ) {

            theNewMessage.clean();
            theNewMessage.id = '000000000000000000000000';
            testTemplates.remove.shouldReturnError( done );

        } );

    } );

    describe( 'Array.findMessages()', function () {

        // TODO Try to pass string int to limit

        before( function ( done ) {

            testCreate.Client( done );

        } );

        describe( 'limit', function () {


            it( 'should return error when limit > 1000', function ( done ) {

                testTemplates.findMessages.shouldReturnError( { limit: 1001 }, done );

            } );


            it( 'should not return error when limit == 1000', function ( done ) {

                theNewMessagesArray.findMessages( { limit: 1000 }, function ( err ) {
                    should.not.exist( err );
                    done();
                } );

            } );

            // D
            it( 'should use default limit and return last 100 messages ( no limit, 200 total )', function ( done ) {

                testTemplates.findMessages.shouldFind(
                    {
                        generate:    200,
                        length:      100,
                        textOfFirst: 150,
                        textOfLast:  199
                    },
                    done
                );

            } );

            // E
            it( 'should return last 50 messages ( limit=50, 200 total )', function ( done ) {

                testTemplates.findMessages.shouldFind(
                    {
                        generate:    200,
                        length:      50,
                        textOfFirst: 150,
                        textOfLast:  199,
                        limit:       50
                    },
                    done
                );

            } );

            // F
            it( 'should return last 50 messages ( limit=100, 50 total )', function ( done ) {


                testTemplates.findMessages.shouldFind(
                    {
                        generate:    50,
                        length:      50,
                        textOfFirst: 0,
                        textOfLast:  49,
                        limit:       100
                    },
                    done
                );


            } );

            // G
            it( 'should return first 100 messages ( limit=-100, 200 total )', function ( done ) {


                testTemplates.findMessages.shouldFind(
                    {
                        generate:    200,
                        length:      100,
                        textOfFirst: 0,
                        textOfLast:  99,
                        limit:       -100
                    },
                    done
                );


            } );

        } );

        describe( 'after', function () {

            // H
            it( 'should return 50 messages after someone ( after=.49, 100 total )', function ( done ) {


                testTemplates.findMessages.shouldFind(
                    {
                        generate:    100,
                        length:      50,
                        after:       49,
                        textOfFirst: 50,
                        textOfLast:  99
                    },
                    done
                );

            } );

            // I
            it( 'should return last 100 messages if |someone| is far than 100 ( after=.49, 300 total )', function ( done ) {


                testTemplates.findMessages.shouldFind(
                    {
                        generate:    300,
                        length:      100,
                        textOfFirst: 200,
                        textOfLast:  299,
                        after:       49
                    },
                    done
                );

            } );

            // J
            it( 'should return one new message ( after=.49, 50 total )', function ( done ) {


                testTemplates.findMessages.shouldFind(
                    {
                        generate:    50,
                        length:      1,
                        textOfFirst: 49,
                        after:       48
                    },
                    done
                );


            } );

            // K
            it( 'should return empty array if no any new messages', function ( done ) {


                testTemplates.findMessages.shouldFind(
                    {
                        generate: 50,
                        length:   0,
                        after:    49
                    },
                    done
                );


            } );

            // L
            it( 'should return messages after someone e.t. this someone was removed ( after=.49, 100 total, .49 to remove )', function ( done ) {


                testTemplates.findMessages.shouldFind(
                    {
                        generate:                  100,
                        length:                    50,
                        after:                     49,
                        numbersOfMessagesToRemove: [ 49 ],
                        textOfFirst:               50,
                        textOfLast:                99
                    },
                    done
                );


            } );


            // M
            it( 'should return last-1 messages if someone and the next message was removed ( 100 total )', function ( done ) {


                testTemplates.findMessages.shouldFind(
                    {
                        generate:                  100,
                        length:                    49,
                        after:                     49,
                        numbersOfMessagesToRemove: [ 49, 52 ],
                        textOfFirst:               50,
                        textOfLast:                99
                    },
                    done
                );


            } );


            // N
            it( 'should return empty array if we try to find after last-1, but last-1 and last was removed', function ( done ) {


                testTemplates.findMessages.shouldFind(
                    {
                        generate:                  50,
                        length:                    0,
                        after:                     48,
                        numbersOfMessagesToRemove: [ 48, 49 ]
                    },
                    done
                );


            } );

        } );

        describe( 'limit & after', function () {


            it( 'should return error when limit > 1000 and correct after', function ( done ) {

                testTemplates.findMessages.shouldReturnError( {
                        limit: 1001,
                        after: '000000000000000000000000'
                    },
                    done );

            } );

            it( 'should return error when limit == 0 and after is correct', function ( done ) {

                testTemplates.findMessages.shouldReturnError( { limit: 0, after: '000000000000000000000000' }, done );

            } );

            // last

            // O
            it( 'should return no more than 5 last messages after someone ( after=.60, limit=5, 100 total )', function ( done ) {

                testTemplates.findMessages.shouldFind(
                    {
                        generate: 100,
                        length:   5,
                        limit:    5,
                        after:    60
                    },
                    done
                );

            } );

            // P
            it( 'should return last 5 messages after someone e.t. limit is greater ( after=.39, limit=200, 50 total )', function ( done ) {

                testTemplates.findMessages.shouldFind(
                    {
                        generate: 50,
                        length:   5,
                        limit:    200,
                        after:    44
                    },
                    done
                );

            } );

            // first

            // Q
            it( 'should return no more than 5 first messages after someone ( after=.40, limit=5, 100 total )', function ( done ) {

                testTemplates.findMessages.shouldFind(
                    {
                        generate: 100,
                        length:   5,
                        limit:    -5,
                        after:    44
                    },
                    done
                );

            } );

            // R
            it( 'should return first 5 messages after someone e.t. limit is greater ( after=.39, limit=200, 50 total )', function ( done ) {

                testTemplates.findMessages.shouldFind(
                    {
                        generate: 50,
                        length:   5,
                        limit:    200,
                        after:    44
                    },
                    done
                );

            } );

        } );

        it( 'should return empty error if no messages found by filter', function ( done ) {

            testTemplates.findMessages.shouldFind(
                {
                    generate: 0,
                    length:   0
                },
                done
            );

        } );

    } );

} );