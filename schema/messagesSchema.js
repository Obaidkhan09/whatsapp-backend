import mongoose from "mongoose";
const { Schema } = mongoose;

const messageSchema = new Schema({
    messages : String,
    name : String,
    timeStamp : String,
    received : Boolean
})
export default mongoose.model('messagescontent', messageSchema);