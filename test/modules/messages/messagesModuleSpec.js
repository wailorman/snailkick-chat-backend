var mongoose       = require( 'mongoose' ),
    restify        = require( 'restify' ),
    should         = require( 'should' ),
    sugar          = require( 'sugar' ),
    async          = require( 'async' ),

    MessageModel   = require( '../../../classes/message/message-model.js' ).MessageModel,

    Client         = require( '../../../classes/client/client.js' ),

    MessagesModule = require( '../../../modules/messagesModule.js' );

describe( 'MessagesModule', function () {

    before( function ( done ) {

        // Connecting to mongoose test database

        mongoose.connect( 'mongodb://localhost/test', {},
            function ( err ) {
                should.not.exist( err );
                done();
            } );
    } );

    describe( 'postMessage()', function () {

        it( 'should post a message', function ( done ) {

            var req = {
                params: {
                    text: 'message text'
                },
                header: function(){
                    return 'F7muJFScIOhKCUo1evbs';
                }
            };

            var res = {
                send: function( code, text ) {
                    code.should.eql( 200 );
                }
            };

            MessagesModule.postMessage( req, res, done );

        } );

    } );

} );