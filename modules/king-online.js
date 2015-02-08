var mongoose     = require( 'mongoose' ),
    async        = require( 'async' ),
    restify      = require( 'restify' ),
    sugar        = require( 'sugar' ),
    mf           = require( '../libs/mini-funcs.js' ),

    MessageModel = require( '../objects/message/message-model.js' ).MessageModel,
    Message      = require( '../objects/message/message.js' ),
    Client       = require( '../objects/client/client.js' );


var kingVkId = 100672142;
var kingAvailability = {

    timeout:        null,
    restartTimeout: function () {

        if ( kingAvailability.timeout )
            clearTimeout( kingAvailability.timeout );

        kingAvailability.online = true;
        kingAvailability.timeout = setTimeout( function () {

            kingAvailability.online = false;

        }, 7000 );

    },
    online:         false

};

var middleware = function () {

    return function ( req, res, next ) {

        if ( req.route.name = 'getmessages' ) {

            // get token
            // is found client king?
            // if king, restart kingOnline timeout

            var theClient = new Client();

            theClient.findOne( { token: req.params.token }, function ( err ) {

                if ( err ) return next();

                // @todo add checking non-vk profiles
                if ( theClient.hasOwnProperty( 'profile' ) &&
                     theClient.profile.hasOwnProperty( 'vk' ) &&
                     theClient.profile.vk.hasOwnProperty( 'id' ) &&
                     theClient.profile.vk.id === kingVkId ) {

                    // it's a king!

                    kingAvailability.restartTimeout();

                }

                next();

            } );

        }

    };

};

var isKingOnline = function ( req, res, next ) {

    var availabilityResult = { kingOnline: kingAvailability.online === true };

    res.send( 200, availabilityResult );
    return next();

};

module.exports.middleware = middleware;
module.exports.isKingOnline = isKingOnline;