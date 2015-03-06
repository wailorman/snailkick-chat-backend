var mongoose = require( 'mongoose' ),
    async    = require( 'async' ),
    restify  = require( 'restify' ),
    sugar    = require( 'sugar' ),
    mf       = require( '../libs/mini-funcs.js' ),

    Client   = require( '../objects/client/client.js' );

/**
 * Find Client by id or token
 * @param req id|token
 * @param res
 * @param next
 */
var getClient = function ( req, res, next ) {

    var query = {};

    if ( !req.params.id ) return next( new restify.InvalidArgumentError( 'id require' ) );

    if ( !mf.isObjectId( req.params.id ) && !mf.isToken( req.params.id ) ) return next( new restify.InvalidArgumentError( 'invalid id' ) );


    if ( mf.isToken( req.params.id ) ) query = { token: req.params.id };
    else if ( mf.isObjectId( req.params.id ) ) query = { id: req.params.id };


    var resultClient = new Client();

    resultClient.findOne( query, function ( err ) {

        if ( err && err instanceof restify.ResourceNotFoundError ) return next( new restify.ResourceNotFoundError( 'no client with such id' ) );

        if ( err ) return next( new restify.InternalError( err.message ) );

        res.send( 200, resultClient );

        return next();

    } );

};

/**
 * If req.params.token exist, this middleware will create req.client
 */
var attachClientToRequest = function ( req, res, next ) {

    if ( !req.params.token ) return next();

    var client = new Client();

    client.findOne( { token: req.params.token }, function ( err ) {

        if ( err ) return next( new restify.ForbiddenError( "Can't find Client with such token!" ) );

        req.client = client;

        return next();

    } );

};

module.exports.getClient = getClient;
module.exports.attachClientToRequest = attachClientToRequest;