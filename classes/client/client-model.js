var mongoose = require( 'mongoose' ),
    Schema   = mongoose.Schema;


module.exports.ClientModel = mongoose.model( 'ClientModel',
    new Schema( {

        name: {
            type:     String,
            required: true
        },

        avatarUrl: {
            type: String
        },

        profileUrl: {
            type: String
        },

        provider: {
            type: String
        }

    }, {

        collection: 'clients'

    } )
);
