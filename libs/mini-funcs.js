var ObjectId = require( 'mongoose' ).Types.ObjectId;

var restify = require( 'restify' );


module.exports.is = function ( variable ) {
    var isVariable = {};

    var isVariableStringObjectId = new RegExp( "^[0-9a-fA-F]{24}$" );

    isVariable.stringObjectId = typeof variable === 'string' &&
                                isVariableStringObjectId.test( variable );

    // not working!
    isVariable.ObjectId = typeof variable !== 'boolean' &&
                          (!variable !== true) &&  // not null
                          variable.hasOwnProperty( 'toString' ) &&
                          isVariableStringObjectId.test( variable.toString() );


    var isVariableStringNumber = new RegExp( '^\\d+$' );


    /**
     * ObjectId string. 24-byte hex. Example: "54669de0dee0f05018e5538a"
     *
     * @typedef {string} stringObjectId
     */

    var isToken = new RegExp( "^[0-9a-zA-Z]{24}$" );

    isVariable.stringToken = isToken.test( variable );


    isVariable.stringNumber = typeof variable === 'string' &&
                              isVariableStringNumber.test( variable );

    isVariable.Date = variable instanceof Date;

    isVariable.null = typeof variable === 'object' &&
                      typeof variable !== 'boolean' &&
                      (!variable === true);

    // some magic checking for null variable
    isVariable.object = typeof variable === 'object' &&
                        typeof variable !== 'boolean' &&
                        (!variable !== true);

    isVariable.undefined = typeof variable == 'undefined';


    isVariable.string = typeof variable !== 'undefined' &&
                        typeof variable === 'string';

    isVariable.number = typeof variable == 'number';

    isVariable.boolean = typeof variable == 'boolean';

    return {
        stringObjectId: isVariable.stringObjectId,
        stringNumber:   isVariable.stringNumber,
        Date:           isVariable.Date,
        null:           isVariable.null,
        object:         isVariable.object,
        undefined:      isVariable.undefined,
        string:         isVariable.string,
        number:         isVariable.number,
        boolean:        isVariable.boolean,

        not: {
            stringObjectId: !isVariable.stringObjectId,
            stringNumber:   !isVariable.stringNumber,
            Date:           !isVariable.Date,
            null:           !isVariable.null,
            object:         !isVariable.object,
            undefined:      !isVariable.undefined,
            string:         !isVariable.string,
            number:         !isVariable.number,
            boolean:        !isVariable.boolean
        }
    };
};

module.exports.isObjectId = function ( variable ) {
    var isVariableStringObjectId = new RegExp( "^[0-9a-f]{24}$" );
    return typeof variable === 'string' && isVariableStringObjectId.test( variable );
};

module.exports.isToken = function ( variable ) {
    var isToken = new RegExp( "^[0-9a-zA-Z]{24}$" );
    return typeof variable === 'string' && isToken.test( variable );
};

module.exports.isNull = function ( variable ) {
    return typeof variable != 'boolean' && (!variable != true);
};


/**
 * Merge two object into one object
 *
 * @param {object}      obj1    First object. Would be overwritten by second
 * @param {object}      obj2    Second object. Primary object
 */
var mergePerms = function ( obj1, obj2 ) {

    /*var result;

     if ( obj1 ){

     result = obj1;

     if ( obj2 ) {
     for ( var k in obj2 ){

     if ( obj2.hasOwnProperty(k) ) {
     if ( typeof obj2[k] == 'object' ) {
     result[k] = mergePerms(obj1[k], obj2[k]);
     }
     if( typeof obj2[k] == 'boolean' ){
     result[k] = obj2[k];
     }
     }else{
     result[k] = obj1[k];
     }

     }
     }
     }else{
     result = null;
     }

     return result;*/

    var groupPerms = obj1;
    var individualPerms = obj2;

    if ( !groupPerms && individualPerms && typeof individualPerms == 'object' ) {
        return individualPerms;
    }

    if ( !individualPerms && groupPerms && typeof groupPerms == 'object' ) {
        return groupPerms;
    }

    if ( !individualPerms && !groupPerms ) {
        return null;
    }

    var result;

    if ( groupPerms && typeof groupPerms == 'object' ) {
        result = groupPerms;
    } else {
        result = {};
    }


    for ( var i in individualPerms ) {

        if ( typeof individualPerms[ i ] == 'object' ) {

            if ( typeof groupPerms[ i ] != 'object' ) {
                groupPerms[ i ] = {};
            }

            result[ i ] = mergePerms( groupPerms[ i ], individualPerms[ i ] );
        }

        if ( typeof individualPerms[ i ] == 'boolean' ) {

            result[ i ] = individualPerms[ i ];

        }

    }

    return result;

};

module.exports.mergePerms = mergePerms;




/**
 * Validate perms object
 *
 * @todo write unit tests for validatePerms
 *
 * @param {object} perms
 * @returns {boolean}
 */
module.exports.validatePerms = function ( perms ) {



    function checkObjectLevel( obj ) {
        for ( var i in obj ) {

            if ( obj.hasOwnProperty( i ) && obj[ i ] ) {

                // If it's next level...
                // Recursive call self to check next level
                if ( typeof obj[ i ] === 'object' ) {

                    if ( checkObjectLevel( obj[ i ] ) ) {

                        // It's correct perm. property
                        // Continue checking...
                        // To the next property...

                        continue;

                    } else {

                        // Some of props in the next level
                        // is invalid. Break checking.
                        // Because we must return true
                        // only if all the properties is valid

                        return false;

                    }

                }


                // If it's normal permission value (boolean)
                if ( typeof obj[ i ] === 'boolean' ) {

                    // Continue checking

                    continue;
                }


                // If the property not next level
                // and not normal permission value (boolean)
                // it's incorrect property. Then we should
                // break checking, because one of the property
                // is invalid

                return false;

            } else {

                // Object property is null.
                // So, it can be a permission.
                //
                // The false permission

                return true;
            }
        }

        return true;

    }

    if ( typeof perms === 'boolean' && perms === true ) {
        return false;
    }

    return checkObjectLevel( perms );

};

module.exports.isInArray = function ( varToFind, array ) {

    for ( var i in array ) {

        if ( array.hasOwnProperty( i ) && array[ i ] === varToFind ) {

            return true;

        }

    }

    return false;
};

module.exports.ObjectId = require('mongodb').ObjectID;