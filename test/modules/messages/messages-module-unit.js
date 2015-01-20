var mongoose       = require( 'mongoose' ),
    restify        = require( 'restify' ),
    should         = require( 'should' ),
    sugar          = require( 'sugar' ),
    async          = require( 'async' ),

    MessageModel   = require( '../../../objects/message/message-model.js' ).MessageModel,

    Client         = require( '../../../objects/client/client.js' ),

    MessagesModule = require( '../../../modules/messages-module.js' ),


    cleanUp              = {

        Messages: function ( next ) {

            MessageModel.find().remove().exec( function ( err ) {
                should.not.exist( err );
                next();
            } );

        }

    },

    clientToken,
    attachToken = function ( next ) {

        var theClient = new Client();

        theClient.create(
            {
                name:   'Сергей Попов',
                avatar: 'http://cs314730.vk.me/v314730142/c46b/xF8PzAU0l_8.jpg'
            },
            function ( err ) {

                should.not.exist( err );

                theClient.attachToken( function ( err, token ) {

                    should.not.exist( err );

                    clientToken = token;
                    return next();

                } );

            }
        );

    },


    testTemplates = {

        /**
         *
         * @param parameters
         * @param [parameters.limit]
         * @param [parameters.checkResultArray]
         * @param [parameters.length]
         * @param [parameters.shouldReturnError]
         *
         * @param done
         */
        getMessages: function( parameters, done ){

            // request
            var req = {
                params: {
                    limit: parameters.limit ? parameters.limit : 0
                }
            };

            // result
            var res = {

                send: function( code, data ){

                    if ( parameters.shouldReturnError )
                        code.should.not.eql( 200 );
                    else
                        code.should.eql( 200 );


                    // Checking length

                    if ( parameters.length )
                        data.length.should.eql( parameters.length );


                    // Checking result array

                    Object.each( parameters.checkResultArray, function( key, value ){

                        data[ key ].text.should.eql( value );

                    } );

                }

            };

            var nextCallback = function ( err ) {

                if ( parameters.shouldReturnError )
                    should.exist( err );
                else
                    should.not.exist( err );

                return done();

            };

            MessagesModule.findMessages( req, res, nextCallback );

        },

        /**
         *
         * @param parameters
         * @param [parameters.amount]
         * @param [parameters.strKey]
         * @param [parameters.shouldReturnError]
         * @param done
         */
        postMessages: function( parameters, done ){

            async.timesSeries(
                parameters.amount,
                function ( n, tcb ) {

                    var messageTextStr = ( parameters.strKey ? parameters.strKey : null ) + n;

                    var req = {

                        params: {
                            text: messageTextStr
                        },

                        header: function( headerStr ){

                            if ( headerStr === 'token' ) return clientToken;

                        }

                    };

                    var res = {

                        send: function ( code, text ){

                            code.should.eql( 200 );

                        }

                    };

                    var nextCallback = function ( err ) {

                        if ( parameters.shouldReturnError )
                            should.exist( err );
                        else
                            should.not.exist( err );

                        return tcb();

                    };

                    MessagesModule.postMessage( req, res, nextCallback );

                },
                done );

        }

    };

describe( 'MessagesModule', function () {

    // Connecting to mongoose test database
    before( function ( done ) {

        mongoose.connect( 'mongodb://localhost/test', {},
            function ( err ) {
                should.not.exist( err );
                done();
            } );
    } );

    // attach token
    before( function ( done ) {

        attachToken( done );

    } );


    // clean messages collection
    before( function ( done ) {
        cleanUp.Messages( done );
    });





        /*it( 'should post a message', function ( done ) {

            var req = {
                params: {
                    text: 'message text'
                },
                header: function(){
                    return clientToken;
                }
            };

            var res = {
                send: function( code, text ) {
                    code.should.eql( 200 );
                }
            };

            MessagesModule.postMessage( req, res, done );

        } );*/


        it( 'should return empty array', function ( done ) {

            testTemplates.getMessages( {
                length: 0
            }, done );

        } );

        it( 'should post 1 message and find it', function ( done ) {

            async.series( [

                // . Post
                function ( scb ) {

                    testTemplates.postMessages( {
                        amount: 1,
                        strKey: '1_'
                    }, scb );

                },

                // . Find
                function ( scb ) {

                    testTemplates.getMessages( {
                        length:           1,
                        checkResultArray: {
                            0: '1_0'
                        }
                    }, scb );

                }

            ], done );

        } );

        it( 'should post another message and find 2 messages', function ( done ) {

            async.series( [

                // . Post
                function ( scb ) {

                    testTemplates.postMessages( {
                        amount: 1,
                        strKey: '2_'
                    }, scb );

                },

                // . Find
                function ( scb ) {

                    testTemplates.getMessages( {
                        length:           2,
                        checkResultArray: {
                            0: '2_0',
                            1: '1_0'
                        }
                    }, scb );

                }

            ], done );

        } );

        it( 'should post 50 messages and find 52 last messages', function ( done ) {

            async.series( [

                // . Post
                function ( scb ) {

                    testTemplates.postMessages( {
                        amount: 50,
                        strKey: '50_'
                    }, scb );

                },

                // . Find
                function ( scb ) {

                    testTemplates.getMessages( {
                        length:           52,
                        checkResultArray: {
                            0:  '50_49',
                            49: '50_0',
                            50: '2_0',
                            51: '1_0'
                        }
                    }, scb );

                }

            ], done );

        } );

        it( 'should post another 150 messages and find last 100', function ( done ) {

            async.series( [

                // . Post
                function ( scb ) {

                    testTemplates.postMessages( {
                        amount: 150,
                        strKey: '150_'
                    }, scb );

                },

                // . Find
                function ( scb ) {

                    testTemplates.getMessages( {
                        length:           100,
                        checkResultArray: {
                            0:  '150_149',
                            99: '150_50'
                        }
                    }, scb );

                }

            ], done );

        } );

        it( 'should get (limit=1000) last 202 messages', function ( done ) {


            testTemplates.getMessages( {
                limit:            1000,
                length:           202,
                checkResultArray: {
                    0:   '150_149',
                    149: '150_0',
                    150: '50_49',
                    199: '50_0',
                    200: '2_0',
                    201: '1_0'
                }
            }, done );


        } );

        it( 'should return error when try to get messages with limit 1001', function ( done ) {

            testTemplates.getMessages( {
                limit:             1001,
                shouldReturnError: true
            }, done );

        } );

        it( 'should return empty array if limit=0', function ( done ) {

            testTemplates.getMessages( {
                limit:  0,
                length: 0
            }, done );

        } );

        it( 'should return array if we passed string to limit', function ( done ) {

            testTemplates.getMessages( {
                limit:             'zero',
                shouldReturnError: true
            }, done );

        } );


    after( function ( done ) {
        mongoose.connection.close( done );
    } );

} );