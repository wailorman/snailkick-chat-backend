var mongoose             = require( 'mongoose' ),
    restify              = require( 'restify' ),
    should               = require( 'should' ),
    sugar                = require( 'sugar' ),
    async                = require( 'async' ),

    MessageModel         = require( '../../../classes/message/message-model.js' ).MessageModel,

    Client               = require( '../../../classes/client/client.js' ),

    restifyClient        = restify.createJsonClient( {
        url:     'http://localhost:1515/',
        version: '*'
    } ),


    attachTokenToHeaders = function ( next ) {

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

                    restifyClient.headers[ 'token' ] = token;

                    return next();

                } );

            }
        );

    },


    cleanUp              = {

        Messages: function ( next ) {

            MessageModel.find().remove().exec( function ( err ) {
                should.not.exist( err );
                next();
            } );

        }

    },

    testTemplates        = {

        /**
         *
         * @param parameters
         * @param [parameters.length]
         * @param [parameters.checkResultArray]
         * @param [parameters.length]
         * @param [parameters.shouldReturnError]
         *
         * @param next
         */
        getMessages: function ( parameters, next ) {

            var reqStr = '/messages';

            if ( parameters.limit ) reqStr += '?limit=' + parameters.limit;

            restifyClient.get( reqStr, function ( err, req, res, data ) {

                if ( parameters.shouldReturnError ) {
                    should.exist( err );
                    return next();
                } else {
                    should.not.exist( err );
                    res.statusCode.should.eql( 200 );
                }

                res.statusCode.should.eql( 200 );


                // Check length

                if ( parameters.length )
                    data.length.should.eql( parameters.length );


                // Check resultArray

                if ( parameters.checkResultArray ) {

                    Object.each( parameters.checkResultArray, function ( index, value ) {

                        data[ index ].should.eql( value );

                    } );

                }


                next();

            } );

        },

        /**
         *
         * @param parameters
         * @param [parameters.amount]
         * @param [parameters.strKey]
         * @param [parameters.shouldReturnError]
         * @param next
         */
        postMessages: function ( parameters, next ) {

            if ( ! parameters.amount ) return next();

            async.times(
                parameters.amount,
                function ( n, tcb ) {

                    var messageTextStr = parameters.strKey ? parameters.strKey : null + n;

                    restifyClient.post( '/messages', { text: messageTextStr }, function ( err, req, res, data ) {

                        if ( parameters.shouldReturnError ) {
                            should.exist( err );
                            return next();
                        } else {
                            should.not.exist( err );
                            res.statusCode.should.eql( 200 );
                        }

                        tcb();


                    } );

                },
                next );

        }

    };


describe( 'Messages REST', function () {

    before( function ( done ) {

        mongoose.connect(
            'mongodb://localhost/test', {},
            function ( err ) {
                should.not.exist( err );

                cleanUp.Messages( done );
            }
        );

    } );

    before( function ( done ) {

     attachTokenToHeaders( done );

    } );

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

} );