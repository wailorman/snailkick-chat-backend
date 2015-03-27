var mongoose             = require( 'mongoose' ),
    restify              = require( 'restify' ),
    should               = require( 'should' ),
    sugar                = require( 'sugar' ),
    async                = require( 'async' ),

    MessageModel         = require( '../../../objects/message/message-model.js' ).MessageModel,
    ClientModel          = require( '../../../objects/client/client-model.js' ).ClientModel,

    Client               = require( '../../../objects/client/client.js' ),

    restifyClient        = restify.createJsonClient( {
        url:     'http://localhost:1515/',
        version: '*'
    } ),

    clientToken, clientId,


    attachTokenToHeaders = function ( next ) {

        var theClient = new Client();

        theClient.create(
            {
                name:   'Сергей Попов',
                avatar: 'http://cs314730.vk.me/v314730142/c46b/xF8PzAU0l_8.jpg'
            },
            function ( err ) {

                should.not.exist( err );

                clientToken = theClient.token;
                clientId = theClient.id;

                theClient.attachToken( function ( err, token ) {

                    should.not.exist( err );

                    clientToken = token;

                    return next();

                } );

            }
        );

    },


    cleanUp              = {

        Clients:  function ( next ) {

            ClientModel.find().remove().exec( function ( err ) {

                should.not.exist( err );
                next();

            } );

        },
        Messages: function ( next ) {

            MessageModel.find().remove().exec( function ( err ) {
                should.not.exist( err );
                next();
            } );

            //mongoose.connection.db.dropCollection( 'messages', function ( err ) {
            //
            //    if ( err && err.message != 'ns not found' ) {
            //        next( err );
            //    } else {
            //        next( null );
            //    }
            //
            //} );

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

                        data[ index ].text.should.eql( value );

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

            if ( !parameters.amount ) return next();

            async.timesSeries(
                parameters.amount,
                function ( n, tcb ) {

                    var messageTextStr = (parameters.strKey ? parameters.strKey : null) + n;

                    restifyClient.post( '/messages?token=' + clientToken, {
                        text: messageTextStr
                    }, function ( err, req, res, data ) {

                        if ( parameters.shouldReturnError ) {
                            should.exist( err );
                            return tcb();
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
            'mongodb://mongo.local/snailkick-chat', {},
            function ( err ) {
                should.not.exist( err );

                async.parallel( [

                    cleanUp.Messages,
                    cleanUp.Clients

                ], done );

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

    it( 'should not post message if no token passed', function ( done ) {

        restifyClient.post(
            '/messages',
            {
                text: 'no token passed!'
            },
            function ( err, req, res, data ) {

                should.exist( err );
                done();

            }
        );

    } );

    it( 'should not post message if passed token have no parent client', function ( done ) {

        var theClient, attachedToken;

        async.series( [

            // . create client
            function ( scb ) {

                theClient = new Client();

                theClient.create( { name: 'Some Client' }, function ( err ) {

                    should.not.exist( err );
                    scb();

                } );

            },

            // . attach token
            function ( scb ) {

                theClient.attachToken( function ( err, token ) {

                    should.not.exist( err );
                    attachedToken = token;
                    scb();

                } );

            },

            // . remove client
            function ( scb ) {

                ClientModel.findById( theClient.id ).remove( function ( err ) {

                    should.not.exist( err );
                    scb();

                } );

            },

            // . try to post message
            function ( scb ) {

                restifyClient.post(
                    '/messages?token=' + attachedToken,
                    {
                        text: 'nonexistent client'
                    },
                    function ( err, req, res, data ) {

                        should.exist( err );
                        scb();

                    }
                );

            }

        ], done );

    } );

    it( 'should not post message if passed token not exists', function ( scb ) {

        restifyClient.post(
            '/messages?token=00000000000000000000',
            {
                text: 'nonexistent token'
            },
            function ( err ) {

                should.exist( err );
                scb();

            }
        );

    } );

    describe( 'king online', function () {

        this.timeout( 15000 );

        var kingClient, kingToken;

        var getMessagesByTokenTpl = function ( onLoaded ) {

            restifyClient.get( '/messages?token=' + kingToken, function ( err ) {

                should.not.exist( err );
                onLoaded();


            } );

        };

        var isKingOnline = function ( result ) {

            restifyClient.get( '/is-king-online', function ( err, req, res, data ) {

                should.not.exist( err );

                result( data );

            } );

        };

        before( function ( done ) {

            // create king client and attach token

            async.series( [

                // . create client
                function ( scb ) {

                    kingClient = new Client();
                    kingClient.create(
                        {
                            name:    'The King',
                            avatar:  'http://google.com/1.png',
                            profile: {
                                vk: {
                                    id: 13605301
                                }
                            }
                        },
                        function ( err ) {

                            should.not.exist( err );
                            scb();

                        }
                    );

                },

                // . attach token
                function ( scb ) {

                    kingClient.attachToken( function ( err, token ) {

                        should.not.exist( err );
                        kingToken = token;
                        scb();

                    } );

                }

            ], done );

        } );

        it( 'should show king is online at once GET /messages called', function ( done ) {

            getMessagesByTokenTpl( function () {

                isKingOnline( function ( result ) {

                    result.should.eql( { isKingOnline: true } );
                    done();

                } );

            } );

        } );

        it( 'should show king is online after 4 secs messages check silence', function ( done ) {


            setTimeout( function () {

                isKingOnline( function ( result ) {

                    result.should.eql( { isKingOnline: true } );
                    done();

                } );

            }, 4000 );


        } );

        it( 'should show king is offline after 8 secs ...', function ( done ) {


            setTimeout( function () {

                isKingOnline( function ( result ) {

                    result.should.eql( { isKingOnline: false } );
                    done();

                } );

            }, 4000 );


        } );

    } );

    describe( 'ban list', function () {

        // ban client
        it( 'should ban client', function ( done ) {

            ClientModel.findById( clientId, function ( err, doc ) {

                should.not.exist( err );
                should.exist( doc );
                //should.exist( doc.banned );

                doc.banned = true;
                doc.save( done );

            } );

        } );

        it( 'should not post message by banned client', function ( done ) {

            restifyClient.post(
                '/messages?token=' + clientToken,
                { text: '345' },
                function ( err ) {

                    should.exist( err );

                    done();

                } );

        } );

        it( 'should unban client', function ( done ) {

            ClientModel.findById( clientId, function ( err, doc ) {

                should.not.exist( err );
                should.exist( doc );

                doc.banned = false;
                doc.save( done );

            } );

        } );

        it( 'should post message after unban', function ( done ) {

            testTemplates.postMessages( {
                amount:            1,
                strKey:            'unban_',
                shouldReturnError: false
            }, done );

        } );

    } );

    describe( 'stickers', function () {

        it( 'should post message only with sticker', function ( done ) {

            async.series( [

                function ( scb ) {

                    restifyClient.post(
                        '/messages?token=' + clientToken,
                        {
                            sticker: "01008"
                        },
                        function ( err ) {

                            should.not.exist( err );
                            scb();

                        }
                    );

                },

                function ( scb ) {

                    restifyClient.get(
                        '/messages?limit=1',
                        function ( err, req, res, data ) {

                            var message = data[ 0 ];

                            should.not.exist( err );
                            should.not.exist( message.text );
                            should.exist( message.sticker );

                            message.sticker.should.eql( "01008" );

                            scb();

                        }
                    );

                }

            ], done );

        } );

        it( 'should post message with text & sticker', function ( done ) {

            async.series( [

                function ( scb ) {

                    restifyClient.post(
                        '/messages?token=' + clientToken,
                        {
                            text:    'Message with text and sticker',
                            sticker: "01008"
                        },
                        function ( err ) {

                            should.not.exist( err );
                            scb();

                        }
                    );

                },

                function ( scb ) {

                    restifyClient.get(
                        '/messages?limit=1',
                        function ( err, req, res, data ) {

                            var message = data[ 0 ];

                            should.not.exist( err );
                            should.exist( message.text );
                            should.exist( message.sticker );

                            message.text.should.eql( 'Message with text and sticker' );
                            message.sticker.should.eql( "01008" );

                            scb();

                        }
                    );

                }

            ], done );

        } );

    } );

    describe( 'delete message', function () {

        var messageId, privilegedClientToken;

        // create special client with statuses
        before( function ( done ) {

            var theClient = new Client();

            theClient.create(
                {
                    name:     'Крутой Сергей',
                    avatar:   'http://cs322630.vk.me/v322630142/30f5/W_dxOG7y8AE.jpg',
                    statuses: {
                        elf: true
                    }
                },
                function ( err ) {

                    should.not.exist( err );

                    theClient.attachToken( function ( err, token ) {

                        should.not.exist( err );
                        privilegedClientToken = token;

                        done();

                    } );
                }
            );

        } );

        it( 'should create message', function ( done ) {

            restifyClient.post( '/messages?token=' + clientToken, { text: 'The Random text' },
                function ( err ) {

                    should.not.exist( err );
                    done();

                }
            );

        } );

        it( 'should find new message', function ( done ) {

            restifyClient.get( '/messages', function ( err, req, res, data ) {

                should.not.exist( err );

                //data[ 0 ].id.should.eql( messageId );
                data[ 0 ].text.should.eql( 'The Random text' );
                data[ 0 ].client.should.eql( clientId );

                messageId = data[ 0 ].id;

                done();
            } );

        } );

        it( 'should not allow to delete message for non-admins', function ( done ) {

            restifyClient.del( '/messages/' + messageId + '?token=' + clientToken, function ( err ) {

                should.exist( err );
                done();

            } );

        } );

        it( 'should allow to delete message for admins (elf, king, queen, ...)', function ( done ) {

            restifyClient.del( '/messages/' + messageId + '?token=' + privilegedClientToken, function ( err ) {

                should.not.exist( err );
                done();

            } );

        } );

        it( 'should allow to delete for admins (elf, king, queen)' );

        it( 'should not find deleted message', function ( done ) {

            restifyClient.get( '/messages', function ( err, req, res, data ) {

                should.not.exist( err );

                data[ 0 ].text.should.not.eql( 'The Random text' );

                done();

            } );

        } );

    } );

    after( function ( done ) {
        mongoose.connection.close( done );
    } );


} );