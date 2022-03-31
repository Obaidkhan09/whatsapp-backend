import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema({
    name : {type : String, required : true, minlength : 3, maxlength : 30},
    email : {type : String, required : true, minlength : 8, maxlength : 30},
    password : { type : String, required : true, minlength : 5, maxlength : 100 }
});

export default mongoose.model("users", userSchema);