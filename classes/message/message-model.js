var mongoose = require( 'mongoose' ),
    Schema   = mongoose.Schema;


var messageSchema = new Schema( {

    text: {
        type:     String,
        required: true
    },

    client: {
        type:     Schema.Types.ObjectId,
        required: true
    },

    posted: {
        type:     Date,
        required: true
    }

}, {

    collection: 'messages'

} );


module.exports.MessageModel = mongoose.model( 'MessageModel', messageSchema );
