var mongoose      = require( 'mongoose' ),
    restify       = require( 'restify' ),
    should        = require( 'should' ),
    sugar         = require( 'sugar' ),
    async         = require( 'async' ),

    Client        = require( '../../../objects/client/client.js' ),

    ClientsModule = require( '../../../modules/clients-module.js' );


describe( 'Clients module unit', function () {

    before( function ( done ) {

        // Connecting to mongoose test database

        mongoose.connect(
            'mongodb://localhost/test',
            {},
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
                        name:   'Сергей Попов' + n,
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

                var req = {
                    params: {
                        id: createdClients[ 1 ].id
                    }
                };

                var res = {
                    send: function ( code, data ) {

                        code.should.eql( 200 );

                        data.id.should.eql( createdClients[ 1 ].id );
                        data.name.should.eql( 'Сергей Попов1' );
                        data.avatar.should.eql( 'http://cs314730.vk.me/v314730142/c46b/xF8PzAU0l_8.jpg' );

                    }
                };

                var nextCallback = function ( err ) {

                    should.not.exist( err );
                    done();

                };

                ClientsModule.getClientById( req, res, nextCallback );

            } );

    } );


    it( 'should not find nonexistent Client', function ( done ) {


        var req = {
            params: {
                id: '000000000000000000000000'
            }
        };

        var res = {
            send: function ( code, data ) {}
        };

        var nextCallback = function ( err ) {

            should.exist( err );
            done();

        };

        ClientsModule.getClientById( req, res, nextCallback );

    } );

    after( function ( done ) {
        mongoose.connection.close( done );
    } );

} );