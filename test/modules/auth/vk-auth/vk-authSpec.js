var mongoose = require( 'mongoose' ),
    should   = require( 'should' ),
    async    = require( 'async' ),
    sugar    = require( 'sugar' ),
    restify  = require( 'restify' ),
    mf       = require( '../../../../libs/mini-funcs.js' ),

    vkAuth = require('../../../../modules/auth/vk-auth.js');

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

                client.profile.vk.id.should.eql( profileToCheck.id );

                client.name.should.match( /NoName/i );

                should.not.exist( client.profile.vk.first_name );
                should.not.exist( client.profile.vk.last_name );

                should.not.exist( client.avatar );
                should.not.exist( client.profile.vk.avatar );

                done();

            } );

        } );

        it( 'should use NoName e.t. we passed first_name', function ( done ) {

            var profileToCheck = {
                id: 1554168565434,
                first_name: 'Name'
            };

            vkAuth.getClientByVkProfile( profileToCheck, function ( err, client ) {

                should.not.exist( err );

                client.profile.vk.id.should.eql( profileToCheck.id );

                client.name.should.match( /NoName/i );

                should.exist( client.profile.vk.first_name );
                should.not.exist( client.profile.vk.last_name );

                should.not.exist( client.avatar );
                should.not.exist( client.profile.vk.avatar );

                done();

            } );

        } );

        it( 'should return correct name', function ( done ) {

            var profileToCheck = {
                id: 1554168565434,
                first_name: 'Name',
                last_name: 'Last'
            };

            vkAuth.getClientByVkProfile( profileToCheck, function ( err, client ) {

                should.not.exist( err );

                client.profile.vk.id.should.eql( profileToCheck.id );

                client.name.should.eql( 'Name Last' );

                should.exist( client.profile.vk.first_name );
                should.exist( client.profile.vk.last_name );

                client.profile.vk.first_name.should.eql( profileToCheck.first_name );
                client.profile.vk.last_name.should.eql( profileToCheck.last_name );

                should.not.exist( client.avatar );
                should.not.exist( client.profile.vk.avatar );

                done();

            } );

        } );

        it( 'should return correct name and avatar', function ( done ) {

            var profileToCheck = {
                id: 1554168565434,
                first_name: 'Name',
                last_name: 'Last',
                photo_max: 'http://google.com/1.png'
            };

            vkAuth.getClientByVkProfile( profileToCheck, function ( err, client ) {

                should.not.exist( err );

                client.profile.vk.id.should.eql( profileToCheck.id );

                client.name.should.eql( 'Name Last' );

                should.exist( client.profile.vk.first_name );
                should.exist( client.profile.vk.last_name );

                client.avatar.should.eql( profileToCheck.photo_max );
                client.profile.vk.photo_max.should.eql( profileToCheck.photo_max );

                done();

            } );

        } );

    } );

} );