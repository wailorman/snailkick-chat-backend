var mongoose = require( 'mongoose' ),
    Schema   = mongoose.Schema;

module.exports.ClientModel = mongoose.model( 'ClientModel',
    new Schema( {

        name: {
            type:     String,
            required: true
        },

        avatar: {
            type: String
        },

        profile: {
            type: Object
        },

        statuses: {
            type: Object
        }

    }, {

        collection: 'clients'

    } )
);
