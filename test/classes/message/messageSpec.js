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
    findMessagesArray      = [],

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

        cleanUp.messages( function () {

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
         * @param [parameters]
         *
         * @param [parameters.generateKey]
         * @param [parameters.generateAmount]
         *
         * @param [parameters.checkResultArray]
         * @param [parameters.checkLength]
         *
         * @param [parameters]
         * @param [parameters.lastText]
         * @param [parameters.limit]
         *
         * @param next
         */
        shouldFind: function ( parameters, next ) {

            var lastParameter,
                generatedMessagesArray = [];

            async.series( [

                // . Generate messages
                function ( scb ) {

                    if ( !parameters.generateKey ) return scb();

                    async.timesSeries(
                        parameters.generateAmount,
                        function ( n, tcb ) {

                            var theMessage = new Message();

                            theMessage.post(
                                {
                                    text:   parameters.generateKey + n,
                                    client: theNewClient
                                },
                                function ( err ) {

                                    should.not.exist( err );

                                    generatedMessagesArray.push( theMessage );

                                    tcb();

                                }
                            );

                        }, scb
                    );

                },

                // . Prepare last
                function ( scb ) {

                    lastParameter = null;

                    if ( parameters.lastText ) {

                        MessageModel.findOne( { text: parameters.lastText }, function ( err, doc ) {

                            should.not.exist( err );
                            //should.exist( doc );

                            if ( !doc ) return scb();

                            lastParameter = doc._id.toString();

                            scb();

                        } );

                    } else scb();

                },

                // . Find
                function ( scb ) {

                    findMessagesArray = [];
                    findMessagesArray.findMessages(
                        {
                            last:  lastParameter,
                            limit: parameters.limit
                        },
                        function ( err ) {

                            should.not.exist( err );
                            scb();

                        }
                    );

                },

                // . Check results
                function ( scb ) {

                    if ( parameters.checkLength ) findMessagesArray.length.should.eql( parameters.checkLength );

                    if ( parameters.checkResultArray ) {

                        var keysToCheck = Object.extended( parameters.checkResultArray ).keys();

                        keysToCheck.each( function ( n ) {

                            var indexOfMessageToCheck = n,
                                messageToCheck = findMessagesArray[ parseInt( indexOfMessageToCheck ) ]; //.text.should.eql( parameters.checkResultArray[ n ] );

                            messageToCheck.text.should.eql( parameters.checkResultArray[ n ] );

                        } );

                    }

                    scb();

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


describe( 'Message', function () {

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

        describe( 'with last', function () {

            before( function ( done ) {

                cleanUp.messages( done );

            } );

            it( 'B. No new messages -> empty array', function ( done ) {

                testTemplates.findMessages.shouldFind(
                    {
                        generateKey:    'gen',
                        generateAmount: 100,
                        checkLength:    0,
                        lastText:       'gen99'
                    },
                    done
                );

            } );

            it( 'C. Add one -> new + 99gen', function ( done ) {

                testTemplates.findMessages.shouldFind(
                    {
                        generateKey:      'new',
                        generateAmount:   1,
                        checkLength:      100,
                        checkResultArray: {
                            0:  'new0',
                            1:  'gen99',
                            99: 'gen1'
                        },
                        lastText:         'gen99'
                    },
                    done
                );

            } );

            it( 'D. Add another one -> new + new + 98gen', function ( done ) {

                testTemplates.findMessages.shouldFind(
                    {
                        generateKey:      'next',
                        generateAmount:   2,
                        checkLength:      100,
                        checkResultArray: {
                            0:  'next1',
                            1:  'next0',
                            2:  'new0',
                            3:  'gen99',
                            99: 'gen3'
                        },
                        lastText:         'gen99'
                    },
                    done
                );

            } );

            it( 'E. Remove one', function ( done ) {

                async.series( [

                    // . Remove message
                    function ( scb ) {

                        MessageModel.findOneAndRemove( { text: 'next0' }, scb );

                    },

                    // . Check
                    function ( scb ) {

                        testTemplates.findMessages.shouldFind(
                            {
                                checkLength:      100,
                                checkResultArray: {
                                    0:  'next1',
                                    1:  'new0',
                                    2:  'gen99',
                                    99: 'gen2'
                                },
                                lastText:         'gen99'
                            },
                            scb
                        );

                    }

                ], function ( err ) {

                    should.not.exist( err );
                    done();

                } );

            } );

            it( 'F. Add 50', function ( done ) {

                testTemplates.findMessages.shouldFind(
                    {
                        generateKey:      'at',
                        generateAmount:   50,
                        checkLength:      100,
                        checkResultArray: {
                            0:  'at49',
                            49: 'at0',
                            50: 'next1',
                            51: 'new0',
                            52: 'gen99',
                            99: 'gen52'
                        },
                        lastText:         'gen99'
                    },
                    done
                );

            } );

            it( 'G. Add 70 -> 70 + 30', function ( done ) {

                testTemplates.findMessages.shouldFind(
                    {
                        generateKey:      'x',
                        generateAmount:   70,
                        checkLength:      100,
                        checkResultArray: {
                            0:  'x69',
                            69: 'x0',
                            70: 'at49',
                            99: 'at20'
                        },
                        lastText:         'gen99'
                    },
                    done
                );

            } );

            it( 'H. Change last to x69', function ( done ) {

                testTemplates.findMessages.shouldFind(
                    {
                        checkLength: 0,
                        lastText:    'x69'
                    },
                    done
                );

            } );

        } );

        describe( 'no parameters', function () {

            before( function ( done ) {

                cleanUp.messages( done );

            } );

            it( 'J. No any new -> 100', function ( done ) {

                testTemplates.findMessages.shouldFind(
                    {
                        generateKey:      'gen',
                        generateAmount:   100,
                        checkLength:      100,
                        checkResultArray: {
                            0:  'gen99',
                            99: 'gen0'
                        }
                    },
                    done
                );

            } );

            it( 'K. 1 new', function ( done ) {

                testTemplates.findMessages.shouldFind(
                    {
                        generateKey:      'new',
                        generateAmount:   1,
                        checkLength:      100,
                        checkResultArray: {
                            0:  'new0',
                            1:  'gen99',
                            99: 'gen1'
                        }
                    },
                    done
                );

            } );

            it( 'L. 70 new', function ( done ) {

                testTemplates.findMessages.shouldFind(
                    {
                        generateKey:      'next',
                        generateAmount:   70,
                        checkLength:      100,
                        checkResultArray: {
                            0:  'next69',
                            69: 'next0',
                            70: 'new0',
                            71: 'gen99',
                            99: 'gen71'
                        }
                    },
                    done
                );

            } );

        } );

        describe( 'with limit', function () {

            before( function ( done ) {

                cleanUp.messages( done );

            } );

            it( 'N. No new', function ( done ) {

                testTemplates.findMessages.shouldFind(
                    {
                        generateKey:      'gen',
                        generateAmount:   150,
                        checkLength:      50,
                        checkResultArray: {
                            0:  'gen149',
                            49: 'gen100'
                        },
                        limit:            50
                    },
                    done
                );

            } );

            it( 'O. 30 new', function ( done ) {

                testTemplates.findMessages.shouldFind(
                    {
                        generateKey:      'new',
                        generateAmount:   30,
                        checkLength:      50,
                        checkResultArray: {
                            0:  'new29',
                            29: 'new0',
                            30: 'gen149',
                            49: 'gen130'
                        },
                        limit:            50
                    },
                    done
                );

            } );

        } );

        describe( 'with limit and last', function () {

            before( function ( done ) {

                cleanUp.messages( done );

            } );

            it( 'Q. No new', function ( done ) {

                testTemplates.findMessages.shouldFind(
                    {
                        generateKey:    'gen',
                        generateAmount: 100,
                        checkLength:    0,
                        limit:          50,
                        last:           'gen99'
                    },
                    done
                );

            } );

            it( 'R. 10 new', function ( done ) {

                testTemplates.findMessages.shouldFind(
                    {
                        generateKey:      'new',
                        generateAmount:   10,
                        checkLength:      50,
                        checkResultArray: {
                            0:  'new9',
                            9:  'new0',
                            10: 'gen99',
                            49: 'gen60'
                        },
                        limit:            50,
                        lastText:         'gen99'
                    },
                    done
                );

            } );

            it( 'S. 60 new', function ( done ) {

                testTemplates.findMessages.shouldFind(
                    {
                        generateKey:      'next',
                        generateAmount:   60,
                        checkLength:      50,
                        checkResultArray: {
                            0:  'next59',
                            49: 'next10'
                        },
                        limit:            50,
                        lastText:         'gen99'
                    },
                    done
                );

            } );

        } );

        it( 'should return empty array if no messages', function ( done ) {

            async.series( [

                cleanUp.messages,
                function ( scb ) {

                    findMessagesArray = [];
                    findMessagesArray.findMessages( null, function ( err ) {

                        should.not.exist( err );

                        findMessagesArray.length.should.eql( 0 );

                        scb();

                    } );

                }

            ], done );

        } );

    } );

} );