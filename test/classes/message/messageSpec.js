var mongoose              = require( 'mongoose' ),
    should                = require( 'should' ),
    async                 = require( 'async' ),
    sugar                 = require( 'sugar' ),
    restify               = require( 'restify' ),

    Message                = require( '../../../classes/message/message.js' ),
    MessageModel           = require( '../../../classes/message/message-model.js' ).ClientModel;

describe( 'Message class', function () {

    describe( '.post()' );

    describe( '.remove()' );

    describe( 'Array.findMessages()', function () {

        describe( 'limit', function () {

            it( 'should return error when limit > 1000' );

            it( 'should return error when limit == 0' );

            it( 'should not return error when limit == 1000' );

            it( 'should use default limit and return last 100 messages ( no limit, 200 total )' );

            it( 'should return last 100 messages ( limit=100, 200 total )' );

            it( 'should return last 50 messages ( limit=100, 50 total )' );

            it( 'should return first 100 messages ( limit=-100, 200 total )' );

        } );

        describe( 'after', function () {

            it( 'should return 50 messages after someone ( after=.49, 100 total )' );

            it( 'should return last 100 messages if someone is more far than 100 ( after=.49, 300 total )' )

            it( 'should return one new message ( after=.49, 50 total )' );

            it( 'should return empty array if no any new messages' );

            it( 'should return messages after someone e.t. this someone was removed' );

            it( 'should return n-1 messages if someone and the next message was removed' );

            it( 'should return empty array if we try to find after last-1, but last-1 and last was removed' );

        } );

        describe( 'limit & after', function () {

            it( 'should return error when limit > 1000 and correct after' );

            it( 'should not return error when limit == 1000 and correct after' );

            it( 'should return error when limit == 0 and after is correct' );

            // last

            it( 'should return no more than 5 last messages after someone ( after=.40, limit=5, 100 total )' );

            it( 'should return last 5 messages after someone e.t. limit is greater ( after=.39, limit=200, 50 total )' );

            // first

            it( 'should return no more than 5 first messages after someone ( after=.40, limit=5, 100 total )' );

            it( 'should return first 5 messages after someone e.t. limit is greater ( after=.39, limit=200, 50 total )' );

        } );

    } );

} );