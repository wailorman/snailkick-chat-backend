var mongoose = require( 'mongoose' ),
    async    = require( 'async' ),
    restify  = require( 'restify' ),
    sugar    = require( 'sugar' ),
    mf       = require( '../libs/mini-funcs.js' ),

    Client   = require( '../objects/client/client.js' );


var getClientById = function ( req, res, next ) {

    if ( ! req.params.id ) return next( new restify.InvalidArgumentError( 'id require' ) );

    if ( ! mf.isObjectId( req.params.id ) ) return next( new restify.InvalidArgumentError( 'invalid id' ) );

    var resultClient = new Client();

    resultClient.findOne( { id: req.params.id }, function ( err ) {

        console.log( '11111' );

        if ( err && err instanceof restify.ResourceNotFoundError ) return next( new restify.ResourceNotFoundError( 'no client with such id' ) );

        if ( err ) return next( new restify.InternalError( err.message ) );

        res.send( 200, resultClient );

        return next();

    } );

};

module.exports.getClientById = getClientById;