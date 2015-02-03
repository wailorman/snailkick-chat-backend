var mongoose = require( 'mongoose' ),
    Schema   = mongoose.Schema;


module.exports.TokenModel = mongoose.model( 'TokenModel', new Schema( {

    token: {
        type:     String,
        required: true
    },

    client: {
        type:     Schema.Types.ObjectId,
        required: true
    }

}, {

    collection: 'tokens',
    capped: 10240

} ) );
