var mongoose     = require( 'mongoose' ),
    should       = require( 'should' ),
    async        = require( 'async' ),
    sugar        = require( 'sugar' ),
    restify      = require( 'restify' ),

    Message      = require( '../../../objects/message/message.js' ),
    MessageModel = require( '../../../objects/message/message-model.js' ).MessageModel,

    ClientModel  = require( '../../../objects/client/client-model.js' ).ClientModel,
    Client       = require( '../../../objects/client/client.js' );


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

    findOne: {

        shouldFind: function ( filter, next ) {

            theNewMessage = new Message();

            theNewMessage.findOne( filter, function ( err ) {

                should.not.exist( err );

                should.exist( theNewMessage.id );
                should.exist( theNewMessage.text );
                should.exist( theNewMessage.posted );
                should.exist( theNewMessage.client );

                theNewMessage.posted.should.be.instanceof( Date );

                next();

            } );

        },

        shouldReturnError: function ( filter, next ) {

            theNewMessage = new Message();

            theNewMessage.findOne( filter, function ( err ) {

                should.exist( err );

                next();

            } );

        },

        shouldReturn404: function ( filter, next ) {

            theNewMessage = new Message();

            theNewMessage.findOne( filter, function ( err ) {

                should.exist( err );

                err.should.be.instanceof( restify.ResourceNotFoundError );

                next();

            } );

        }

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

    describe( '.findOne()', function () {

        describe( 'should find', function () {

            beforeEach( function ( done ) {

                testCreate.Message( done );

            } );

            it( 'existent message by id', function ( done ) {

                async.series( [

                    testCreate.Message,
                    function ( scb ) {

                        var idToFind = theNewMessage.id;
                        testTemplates.findOne.shouldFind( { id: idToFind }, scb );

                    }

                ], done );

            } );

        } );

        describe( 'should not find', function () {

            beforeEach( function ( done ) {

                testCreate.Message( done );

            } );

            it( 'nonexistent message', function ( done ) {

                testTemplates.findOne.shouldReturn404( { id: '000000000000000000000000' }, done );

            } );

            it( 'removed message', function ( done ) {

                var removedMessageId = theNewMessage.id;

                async.series( [

                    // remove
                    function ( scb ) {

                        theNewMessage.remove( scb );

                    },

                    // try to find
                    function ( scb ) {
                        testTemplates.findOne.shouldReturn404( { id: removedMessageId }, scb );
                    }

                ], done );

            } );

            it( 'by invalid id', function ( done ) {

                testTemplates.findOne.shouldReturnError( { id: '2345rf' }, done );

            } );

        } );

    } );

    describe( 'Array.findMessages()', function () {

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

    after( function ( done ) {
        mongoose.connection.close( done );
    } );

} );