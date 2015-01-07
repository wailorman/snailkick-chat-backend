var mongoose              = require( 'mongoose' ),
    should                = require( 'should' ),
    async                 = require( 'async' ),
    sugar                 = require( 'sugar' ),
    restify               = require( 'restify' ),

    Client                = require( '../../../classes/client/client.js' ),
    ClientModel           = require( '../../../classes/client/client-model.js' ).ClientModel,

    defaultLimit          = 50,

    theNewClient,
    theNewClientArguments = {
        name:       'Name Surname',
        avatarUrl:  'http://google.com/',
        profileUrl: 'http://google.com/',
        provider:   'google'
    },

    theNewClientsArray,

    testTemplates         = {

        create: {

            shouldCreate: function ( data, next ) {

                theNewClient = new Client();

                theNewClient.create( data, function ( err ) {

                    should.not.exist( err );

                    theNewClient.id.should.be.type( 'string' );

                    theNewClient.name.should.be.type( 'string' );
                    theNewClient.name.should.eql( data.name );

                    if ( data.avatarUrl ) {
                        theNewClient.avatarUrl.should.be.type( 'string' );
                        theNewClient.avatarUrl.should.eql( data.avatarUrl );
                    }

                    if ( data.profileUrl ) {
                        theNewClient.profileUrl.should.be.type( 'string' );
                        theNewClient.profileUrl.should.eql( data.profileUrl );
                    }

                    if ( data.provider ) {
                        theNewClient.provider.should.be.type( 'string' );
                        theNewClient.provider.should.eql( data.provider );
                    }

                    next();

                } );

            },

            shouldReturnError: function ( data, next ) {

                theNewClient = new Client();

                theNewClient.create( data, function ( err ) {

                    should.exist( err );
                    next();

                } );

            }

        },

        remove: {

            shouldRemove: function ( next ) {

                theNewClient.remove( function ( err ) {

                    should.not.exist( err );
                    next();

                } );

            },

            shouldReturnError: function ( next ) {

                theNewClient.remove( function ( err ) {

                    should.exist( err );
                    next();

                } );

            }

        },

        findOne: {

            shouldFind: function ( filter, next ) {

                theNewClient = new Client();

                theNewClient.findOne( filter, function ( err ) {

                    should.not.exist( err );

                    theNewClient.id.should.eql( filter.id );

                    should.exist( theNewClient.name );

                    next();

                } );

            },

            shouldReturn404: function ( filter, next ) {

                theNewClient = new Client();

                theNewClient.findOne( filter, function ( err ) {

                    should.exist( err );
                    err.should.be.instanceof( restify.ResourceNotFoundError );
                    next();

                } );
            },

            shouldReturnError: function ( filter, next ) {

                theNewClient = new Client();

                theNewClient.findOne( filter, function ( err ) {

                    should.exist( err );
                    next();

                } );

            }

        },

        findClients: {

            shouldFind: function ( filter, expectedNum, next ) {

                theNewClientsArray = [];

                theNewClientsArray.findClients( filter, function ( err ) {

                    should.not.exist( err );

                    theNewClientsArray.length.should.eql( expectedNum );

                    if ( expectedNum > 1 )
                        theNewClientsArray[ 0 ].id.should.not.eql( theNewClientsArray[ 1 ].id );

                    next();

                } );

            },

            shouldReturn404: function ( filter, next ) {

                theNewClientsArray = [];

                theNewClientsArray.findClients( filter, function ( err ) {

                    should.exist( err );
                    err.should.be.instanceof( restify.ResourceNotFoundError );

                    next();

                } );

            },

            shouldReturnError: function ( filter, next ) {

                theNewClientsArray = [];

                theNewClientsArray.findClients( filter, function ( err ) {

                    should.exist( err );

                    next();

                } );

            }

        }

    },

    reCreate              = {

        Client: function ( next ) {

            cleanUp.Clients( function () {

                theNewClient = new Client();

                theNewClient.create( theNewClientArguments, function ( err ) {

                    should.not.exist( err );

                    next();

                } );

            } );


        }
    },

    cleanUp               = {

        Clients: function ( next ) {

            theNewClient = null;

            ClientModel.find().remove().exec( function ( err ) {
                should.not.exist( err );
                next();
            } );

        }

    };

describe( 'Client class', function () {

    before( function ( done ) {

        // Connecting to mongoose test database

        mongoose.connect( 'mongodb://localhost/test', {},
            function ( err ) {
                should.not.exist( err );
                done();
            } );
    } );

    describe( '.create()', function () {

        describe( 'should create', function () {

            beforeEach( function ( done ) {

                cleanUp.Clients( done );

            } );

            it( 'with name', function ( done ) {

                testTemplates.create.shouldCreate( { name: 'The Name' }, done );

            } );

            it( 'with name, avatar', function ( done ) {

                testTemplates.create.shouldCreate(
                    {
                        name:      'The Name',
                        avatarUrl: 'http://google.com/'
                    },
                    done
                );

            } );

            it( 'with name, provider', function ( done ) {

                testTemplates.create.shouldCreate(
                    {
                        name:     'The Name',
                        provider: 'vk'
                    },
                    done
                );

            } );

            it( 'with name, avatar, profile', function ( done ) {

                testTemplates.create.shouldCreate(
                    {
                        name:       'The Name',
                        avatarUrl:  'http://google.com/',
                        profileUrl: 'http://google.com/'
                    },
                    done
                );

            } );

            it( 'with name, avatar, profile, provider', function ( done ) {

                testTemplates.create.shouldCreate(
                    {
                        name:       'The Name',
                        avatarUrl:  'http://google.com/',
                        profileUrl: 'http://google.com/',
                        provider:   'google'
                    },
                    done
                );

            } );

        } );

        describe( 'should not create', function () {

            beforeEach( function ( done ) {

                cleanUp.Clients( done );

            } );

            it( 'with null data', function ( done ) {

                testTemplates.create.shouldReturnError( null, done );

            } );

            it( 'with avatar', function ( done ) {

                testTemplates.create.shouldReturnError(
                    {
                        avatarUrl: 'http://google.com/'
                    },
                    done
                );

            } );

            it( 'with avatar, profile', function ( done ) {

                testTemplates.create.shouldReturnError(
                    {
                        avatarUrl:  'http://google.com/',
                        profileUrl: 'http://google.com/'
                    },
                    done
                );

            } );

            it( 'with avatar, profile, provider', function ( done ) {

                testTemplates.create.shouldReturnError(
                    {
                        avatarUrl:  'http://google.com/',
                        profileUrl: 'http://google.com/',
                        provider:   'google'
                    },
                    done
                );

            } );

        } );

    } );

    describe( '.remove()', function () {

        beforeEach( function ( done ) {

            reCreate.Client( done );

        } );

        it( 'should remove', function ( done ) {

            testTemplates.remove.shouldRemove( done );

        } );

        it( 'should not remove already removed Client', function ( done ) {

            testTemplates.remove.shouldRemove( function () {

                testTemplates.remove.shouldReturnError( done );

            } );

        } );

    } );

    describe( '.findOne()', function () {

        beforeEach( function ( done ) {

            reCreate.Client( done );

        } );

        it( 'should find by id', function ( done ) {

            testTemplates.findOne.shouldFind(
                {
                    id: theNewClient.id
                },
                done
            );

        } );

        describe( 'should not find', function () {

            it( 'nonexistent Client', function ( done ) {

                testTemplates.findOne.shouldReturn404(
                    {
                        id: '000000000000000000000000'
                    },
                    done
                );

            } );

            it( 'removed Client', function ( done ) {

                var removedId = theNewClient.id;

                async.series(
                    [

                        function ( scb ) {

                            theNewClient.remove( scb );

                        },
                        function ( scb ) {

                            testTemplates.findOne.shouldReturn404( { id: removedId }, scb );

                        }

                    ],
                    done
                );

            } );

            it( 'invalid id', function ( done ) {

                testTemplates.findOne.shouldReturnError( { id: 200000200000 }, done );

            } );

        } );

    } );

    xdescribe( '.Array.findClients()', function () {

        describe( 'should find', function () {

            beforeEach( function ( done ) {

                cleanUp.Clients( function () {

                    async.times( 10, function ( n, tcb ) {

                            theNewClient = new Client();

                            theNewClient.create( theNewClientArguments, function ( err ) {

                                should.not.exist( err );
                                tcb();

                            } );

                        },
                        done
                    );

                } );

            } );

            describe( '1', function () {

                beforeEach( function ( done ) {

                    reCreate.Client( done );

                } );

                it( 'by id', function ( done ) {

                    testTemplates.findClients.shouldFind( { id: theNewClientArguments.id }, 1, done );

                } );

                it( 'by name', function ( done ) {

                    testTemplates.findClients.shouldFind( { name: theNewClientArguments.name }, 1, done );

                } );

                it( 'by provider', function ( done ) {

                    testTemplates.findClients.shouldFind( { provider: theNewClientArguments.provider }, 1, done );

                } );

            } );

            describe( '2', function () {

                beforeEach( function ( done ) {

                    cleanUp.Clients( function () {

                        async.times( 2, function ( n, tcb ) {

                                theNewClient = new Client();

                                theNewClient.create( theNewClientArguments, function ( err ) {

                                    should.not.exist( err );
                                    tcb();

                                } );

                            },
                            done
                        );

                    } );
                } );

                it( 'with the same names', function ( done ) {

                    testTemplates.findClients.shouldFind( { name: theNewClientArguments.name }, 2, done );

                } );

                it( 'with the same provider', function ( done ) {

                    testTemplates.findClients.shouldFind( { provider: theNewClientArguments.provider }, 2, done );

                } );

            } );

            it( '5 clients even though totally are 10 clients', function ( done ) {

                async.series(
                    [

                        // . Create 10 Clients
                        function ( scb ) {

                            async.times( 10, function ( n, tcb ) {

                                    theNewClient = new Client();

                                    theNewClient.create( theNewClientArguments, function ( err ) {

                                        should.not.exist( err );
                                        tcb();

                                    } );

                                },
                                scb
                            );

                        },

                        // . Try to find
                        function ( scb ) {

                            testTemplates.findClients.shouldFind(
                                { name: theNewClientArguments.name, limit: 5 },
                                5,
                                scb
                            );

                        }

                    ],
                    done
                );

            } );

            it( 'empty array if limit == 0', function ( done ) {

                async.series(
                    [

                        // . Create 10 Clients
                        function ( scb ) {

                            async.times( 10, function ( n, tcb ) {

                                    theNewClient = new Client();

                                    theNewClient.create( theNewClientArguments, function ( err ) {

                                        should.not.exist( err );
                                        tcb();

                                    } );

                                },
                                scb
                            );

                        },

                        // . Try to find
                        function ( scb ) {

                            testTemplates.findClients.shouldFind(
                                { name: theNewClientArguments.name, limit: 0 },
                                0,
                                scb
                            );

                        }

                    ],
                    done
                );

            } );

            it( 'if limit is a string value', function ( done ) {

                testTemplates.findClients.shouldFind(
                    {
                        name:  theNewClientArguments.name,
                        limit: "5"
                    },
                    5,
                    done
                );

            } );

            it( 'if filter is null, return all Clients', function ( done ) {

                testTemplates.findClients.shouldFind(
                    null,
                    10,
                    done
                );

            } );

        } );

        describe( 'should return 404 if', function () {

            beforeEach( function ( done ) {

                reCreate.Client( done );

            } );

            it( 'find by nonexistent id', function ( done ) {

                testTemplates.findClients.shouldReturn404(
                    { id: '000000000000000000000000' },
                    done
                );

            } );

            it( 'find by nonexistent name', function ( done ) {

                testTemplates.findClients.shouldReturn404(
                    { name: '000000000000000000000000' },
                    done
                );

            } );

            it( 'find by nonexistent provider', function ( done ) {

                testTemplates.findClients.shouldReturn404(
                    { provider: '000000000000000000000000' },
                    done
                );

            } );

            it( 'no Clients any more', function ( done ) {

                async.series(
                    [

                        cleanUp.Clients,
                        function ( scb ) {

                            testTemplates.findClients.shouldReturn404( { name: theNewClientArguments.name }, scb );

                        }

                    ],
                    done
                );

            } );

        } );

        describe( 'should return error if passed invalid params', function () {

            it( 'not string id', function ( done ) {

                testTemplates.findClients.shouldReturn404(
                    { id: 200000200000 },
                    done
                );

            } );

            it( 'not string name', function ( done ) {

                testTemplates.findClients.shouldReturn404(
                    { name: 200000 },
                    done
                );

            } );

            it( 'not string provider', function ( done ) {

                testTemplates.findClients.shouldReturn404(
                    { provider: 200000200000 },
                    done
                );

            } );

            it( 'not int|string limit', function ( done ) {

                testTemplates.findClients.shouldReturn404(
                    { limit: true },
                    done
                );

            } );

        } );

        it( 'if limit did not passed, should return no more than default limit', function ( done ) {

            async.series(
                [

                    cleanUp.Clients,

                    // . Create many Clients
                    function ( scb ) {

                        async.times( 70, function ( n, tcb ) {

                                theNewClient = new Client();

                                theNewClient.create( theNewClientArguments, function ( err ) {

                                    should.not.exist( err );
                                    tcb();

                                } );

                            },
                            scb
                        );

                    }

                ],
                done
            );

        } );

        xit( 'should use offset if it was passed' );

    } );

} );