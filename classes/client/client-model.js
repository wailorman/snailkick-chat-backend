var mongoose = require( 'mongoose' ),
    Schema   = mongoose.Schema;


var clientSchema = new Schema( {

    name: {
        type:     String,
        required: true
    },

    avatarUrl: {
        type:     String
    },

    profileUrl: {
        type:     String
    },

    provider: {
        type:     String
    }

}, {

    collection: 'clients'

} );


module.exports.ClientModel = mongoose.model( 'ClientModel', clientSchema );
