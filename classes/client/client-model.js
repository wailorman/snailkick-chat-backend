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
            type: Schema.Types.Mixed
        }

    }, {

        collection: 'clients'

    } )
);
