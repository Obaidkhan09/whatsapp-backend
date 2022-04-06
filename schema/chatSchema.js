import mongoose from "mongoose";
const { Schema } = mongoose;

const messageObj = new Schema({
    sender : String,
    message : String,
    timeStamp : String
});

const chat = new Schema({
    sender : String,
    receiver : String,
    messages :[messageObj],
    members : [String],
    timeStamp : String,
});

export default mongoose.model("chats", chat);