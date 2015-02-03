var mongoose = require( 'mongoose' ),
    async    = require( 'async' ),
    restify  = require( 'restify' ),
    sugar    = require( 'sugar' ),
    mf       = require( '../libs/mini-funcs.js' ),

    Client   = require( '../objects/client/client.js' );


var getClient = function ( req, res, next ) {

   var query = {};

    if ( ! req.params.id ) return next( new restify.InvalidArgumentError( 'id require' ) );

    if ( ! mf.isObjectId( req.params.id ) && ! mf.isToken( req.params.id ) ) return next( new restify.InvalidArgumentError( 'invalid id' ) );


    if ( mf.isToken( req.params.id ) ) query = { token: req.params.id };
    else if ( mf.isObjectId( req.params.id ) ) query = { id: req.params.id };



    var resultClient = new Client();

    resultClient.findOne( query, function ( err ) {

        //console.log( '\n' );
        //console.log( 'req.params.id: ' + req.params.id );
        //console.log( 'resultClient.id: ' + resultClient.id );

        if ( err && err instanceof restify.ResourceNotFoundError ) return next( new restify.ResourceNotFoundError( 'no client with such id' ) );

        if ( err ) return next( new restify.InternalError( err.message ) );

        //res.header( "Access-Control-Allow-Origin", "*" );
        res.send( 200, resultClient );

        return next();

    } );

};

module.exports.getClient = getClient;