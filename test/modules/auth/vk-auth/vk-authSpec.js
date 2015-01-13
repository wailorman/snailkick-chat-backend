var mongoose = require( 'mongoose' ),
    should   = require( 'should' ),
    async    = require( 'async' ),
    sugar    = require( 'sugar' ),
    restify  = require( 'restify' ),
    mf       = require( '../../../../libs/mini-funcs.js' ),

    vkAuth   = require( '../../../../modules/auth/vk-auth.js' );

describe( 'vk authentication', function () {

    before( function ( done ) {

        // Connecting to mongoose test database

        mongoose.connect( 'mongodb://localhost/test', {},
            function ( err ) {
                should.not.exist( err );
                done();
            } );
    } );

    describe( 'getClientByVkProfile', function () {

        it( 'should create Client with only profile.id', function ( done ) {

            var profileToCheck = {
                id: 1554168565434
            };

            vkAuth.getClientByVkProfile( profileToCheck, function ( err, client ) {

                should.not.exist( err );

                // client.id
                should.exist( client.id );

                // client.name
                should.exist( client.name );
                client.name.should.match( /NoName/i );

                // client.avatar
                should.not.exist( client.avatar );

                done();

            } );

        } );

        it( 'should return correct name', function ( done ) {

            var profileToCheck = {
                id:          155416856543,
                displayName: 'The Name'
            };

            vkAuth.getClientByVkProfile( profileToCheck, function ( err, client ) {

                should.not.exist( err );

                // client.name
                client.name.should.eql( 'The Name' );

                // client.avatar
                should.not.exist( client.avatar );

                done();

            } );

        } );

        it( 'should return correct name and avatar', function ( done ) {

            var profileToCheck = {
                id:         1554160856544,
                displayName: 'The Name',
                photos:  [ { type: 'photo_max', value: 'http://cs314730.vk.me/v314730142/c473/UFnidpMxrQM.jpg' } ]
            };

            vkAuth.getClientByVkProfile( profileToCheck, function ( err, client ) {

                should.not.exist( err );

                // client.name
                client.name.should.eql( 'The Name' );

                // client.avatar
                client.avatar.should.eql( 'http://cs314730.vk.me/v314730142/c473/UFnidpMxrQM.jpg' );

                done();

            } );

        } );


        it( 'should update Client data', function ( done ) {

            var profileToCheck = {
                id:         1554160856544,
                displayName: 'The Newname',
                photos:  [ { type: 'photo_max', value: 'http://cs314730.vk.me/v314730142/c473/UFnidpMxrq.jpg' } ]
            };

            vkAuth.getClientByVkProfile( profileToCheck, function ( err, client ) {

                should.not.exist( err );

                // client.name
                client.name.should.eql( 'The Newname' );

                // client.avatar
                client.avatar.should.eql( 'http://cs314730.vk.me/v314730142/c473/UFnidpMxrq.jpg' );

                done();

            } );

        } );

    } );

} );