var mongoose              = require( 'mongoose' ),
    should                = require( 'should' ),
    async                 = require( 'async' ),
    sugar                 = require( 'sugar' ),
    restify               = require( 'restify' ),
    mf                    = require( '../../../libs/mini-funcs.js' ),

    Client                = require( '../../../classes/client/client.js' ),
    ClientModel           = require( '../../../classes/client/client-model.js' ).ClientModel,

    defaultLimit          = 50,

    theNewClient,
    theNewClientArguments = {
        name:    'Name Surname',
        avatar:  'http://google.com/',
        profile: {
            vk: {
                id:         '68161840684',
                first_name: 'Name',
                last_name:  'Last',
                photo_max:  'http://google.com/'
            }
        }
    },

    theNewClientsArray,

    testTemplates         = {

        create: {

            shouldCreate: function ( data, next ) {

                theNewClient = new Client();

                theNewClient.create( data, function ( err ) {

                    should.not.exist( err );

                    theNewClient.id.should.be.type( 'string' );
                    mf.isObjectId( theNewClient.id ).should.eql( true );

                    theNewClient.name.should.be.type( 'string' );
                    theNewClient.name.should.eql( data.name );

                    if ( data.avatar ) {
                        theNewClient.avatar.should.be.type( 'string' );
                        theNewClient.avatar.should.eql( data.avatar );
                    }

                    if ( data.profile ) {
                        theNewClient.profile.should.eql( data.profile );
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

                    if ( filter.id ) theNewClient.id.should.eql( filter.id );

                    mf.isObjectId( theNewClient.id ).should.eql( true );

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

                testTemplates.create.shouldCreate(
                    {
                        name: 'The Name'
                    },
                    done
                );

            } );

            it( 'with name, avatar', function ( done ) {

                testTemplates.create.shouldCreate(
                    {
                        name:   'The Name',
                        avatar: 'http://google.com/'
                    },
                    done
                );

            } );

            it( 'with name, avatar, profile', function ( done ) {

                testTemplates.create.shouldCreate(
                    {
                        name:    'The Name',
                        avatar:  'http://google.com/',
                        profile: {
                            vk: {
                                id:         '20205566',
                                first_name: 'Имя',
                                last_name:  'Фамилия',
                                photo_max:  'http://google.com/'
                            }
                        }
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
                        avatar: 'http://google.com/'
                    },
                    done
                );

            } );

            it( 'with avatar, profile', function ( done ) {

                testTemplates.create.shouldReturnError(
                    {
                        avatar:  'http://google.com/',
                        profile: {
                            vk: {
                                id:         '68161840684',
                                first_name: 'Name',
                                last_name:  'Last',
                                photo_max:  'http://google.com/'
                            }
                        }
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

        describe( 'should find by token', function () {

            beforeEach( function ( done ) {

                reCreate.Client( done );

            } );

            it( 'by single token', function ( done ) {

                var tokenToFind;

                async.series( [

                    // attach
                    function ( scb ) {

                        theNewClient.attachToken( function ( err, token ) {

                            should.not.exist( err );

                            tokenToFind = token;

                            scb();

                        } );

                    },

                    // find
                    function ( scb ) {

                        testTemplates.findOne.shouldFind( { token: tokenToFind }, scb );

                    }

                ], done );

            } );

            it( 'by diff tokens', function ( done ) {

                var firstToken, secondToken;

                async.series( [

                    // first token gen
                    function ( scb ) {

                        theNewClient.attachToken( function ( err, token ) {

                            should.not.exist( err );
                            firstToken = token;
                            scb();

                        } );

                    },

                    // second token gen
                    function ( scb ) {

                        theNewClient.attachToken( function ( err, token ) {

                            should.not.exist( err );
                            secondToken = token;
                            scb();

                        } );

                    },

                    // try to find by first token
                    function ( scb ) {

                        testTemplates.findOne.shouldFind( { token: firstToken }, scb );

                    },

                    // try to find by second token
                    function ( scb ) {

                        testTemplates.findOne.shouldFind( { token: secondToken }, scb );

                    }

                ], done );

            } );

        } );

        describe( 'should not find by token', function () {

            beforeEach( function ( done ) {

                reCreate.Client( done );

            } );

            it( 'by nonexistent token', function ( done ) {

                testTemplates.findOne.shouldReturn404( { token: '00000000000000000000' }, done );

            } );

            it( 'removed Client by existent token', function ( done ) {

                var tokenForFind;

                async.series( [

                    // attach token
                    function ( scb ) {

                        theNewClient.attachToken( function ( err, token ) {

                            should.not.exist( err );
                            tokenForFind = token;
                            scb();

                        } );

                    },

                    // remove Client
                    function ( scb ) {

                        theNewClient.remove( scb );

                    },

                    // try to find by token
                    function ( scb ) {

                        testTemplates.findOne.shouldReturn404( { token: tokenForFind }, scb );

                    }

                ], done );

            } );

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

    describe( '.attachToken()', function () {

        describe( 'should attach', function () {

            beforeEach( function ( done ) {
                reCreate.Client( done );
            } );

            it( 'token to Client', function ( done ) {

                theNewClient.attachToken( function ( err, token ) {

                    should.not.exist( err );
                    should.exist( token );

                    token.should.type( 'string' );
                    mf.isToken( token ).should.eql( true );

                    done();

                } );

            } );

            it( 'different tokens on second attach', function ( done ) {

                var firstToken, secondToken;

                async.series( [

                    // generate first token
                    function ( scb ) {

                        theNewClient.attachToken( function ( err, token ) {

                            should.not.exist( err );
                            should.exist( token );

                            firstToken = token;

                            scb();

                        } );

                    },

                    // generate second token
                    function ( scb ) {

                        theNewClient.attachToken( function ( err, token ) {

                            should.not.exist( err );
                            should.exist( token );

                            secondToken = token;

                            scb();

                        } );

                    },

                    // compare
                    function ( scb ) {

                        firstToken.should.not.eql( secondToken );
                        scb();

                    }

                ], done );

            } );

        } );

        describe( 'should not attach', function () {

            beforeEach( function ( done ) {
                reCreate.Client( done );
            } );

            it( 'to nonexistent Client', function ( done ) {

                theNewClient.id = '000000000000000000000000';

                theNewClient.attachToken( function ( err ) {
                    should.exist( err );
                    done();
                } );

            } );

        } );

    } );

} );