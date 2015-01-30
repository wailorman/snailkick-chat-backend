var mongoose      = require( 'mongoose' ),
    restify       = require( 'restify' ),
    should        = require( 'should' ),
    sugar         = require( 'sugar' ),
    async         = require( 'async' ),

    Client        = require( '../../../objects/client/client.js' ),

    ClientsModule = require( '../../../modules/clients-module.js' ),

    ClientForTokenTesting,
    tokenForTesting,

    restifyClient = restify.createJsonClient( {
        url:     'http://localhost:1515/',
        version: '*'
    } );

describe( 'Clients module e2e', function () {

    before( function ( done ) {

        mongoose.connect(
            'mongodb://localhost/test', {},
            function ( err ) {
                should.not.exist( err );
                done();
            }
        );

    } );

    it( 'should find correct Client after creating three Clients', function ( done ) {

        var createdClients = [];

        async.timesSeries(
            3,

            // 1. Create clients
            function ( n, tcb ) {

                var theClient = new Client();

                theClient.create(
                    {
                        name:   '2Сергей Попов' + n,
                        avatar: 'http://cs314730.vk.me/v314730142/c46b/xF8PzAU0l_8.jpg'
                    },
                    function ( err ) {

                        should.not.exist( err );

                        createdClients.push( theClient );

                        tcb();

                    }
                );

            },

            // 2. Find one of them
            function () {

                var getClientsLocation = '/clients/' + createdClients[ 1 ].id;

                restifyClient.get( getClientsLocation, function ( err, req, res, data ) {

                    should.not.exist( err );

                    data.id.should.eql( createdClients[ 1 ].id );
                    data.name.should.eql( '2Сергей Попов1' );
                    data.avatar.should.eql( 'http://cs314730.vk.me/v314730142/c46b/xF8PzAU0l_8.jpg' );

                    done();

                } );

            } );

    } );

    it( 'should not find nonexistent Client', function ( done ) {

        restifyClient.get( '/clients/000000000000000000000000', function ( err, req, res, data ) {

            should.exist( err );
            done();

        } );

    } );

    it( 'should find Client by token', function ( done ) {

        async.series( [

            // . Create Client
            function ( scb ) {

                ClientForTokenTesting = new Client();

                ClientForTokenTesting.create(
                    {
                        name:   'The Name12',
                        avatar: 'http://google.com/'
                    },
                    function ( err ) {

                        should.not.exist( err );

                        ClientForTokenTesting.name.should.eql( 'The Name12' );

                        scb();

                    } );

            },

            // . Attach token
            function ( scb ) {

                ClientForTokenTesting.attachToken( function ( err, token ) {

                    tokenForTesting = token;
                    scb();

                } );

            },

            // . Find by token
            function ( scb ) {

                restifyClient.get( '/clients/' + tokenForTesting, function ( err, req, res, data ) {

                    should.not.exist( err );

                    data.name.should.eql( 'The Name12' );

                    scb();

                } );

            }

        ], done );

    } );

    it( 'should not find token of removed Client', function ( done ) {

        async.series( [

            // . Remove Client
            function ( scb ) {

                ClientForTokenTesting.remove( function ( err ) {

                    should.not.exist( err );

                    scb();

                } );

            },

            // . Find by token
            function ( scb ) {

                restifyClient.get( '/clients/' + tokenForTesting, function ( err, req, res, data ) {

                    should.exist( err );

                    scb();

                } );

            }

        ], done );

    } );

    it( 'should not find nonexistent token', function ( done ) {

        restifyClient.get( '/clients/00000000000000000000', function ( err, req, res, data ) {

            should.exist( err );

            done();

        } );

    } );

    after( function ( done ) {
        mongoose.connection.close( done );
    } );

} );