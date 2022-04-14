import express from "express";
import mongoose from "mongoose";
import cors from 'cors';
import 'dotenv/config';

import signUp from "./routes/signUp.js";
import signIn from "./routes/signIn.js";
import usersRoute from "./routes/user.js";
import chatRoute from "./routes/chat.js";
//app Config
const app = express();
const PORT = process.env.PORT || 5000;
const connection_url = `mongodb+srv://tinderadmin:${process.env.REACT_APP_PASSWORD}@cluster0.g0dgp.mongodb.net/whatsappdb?retryWrites=true&w=majority`

//middleware Config
app.use(cors());
app.use(express.json());

app.use("/api/signUp", signUp);
app.use("/api/signIn", signIn);
app.use("/users", usersRoute);
app.use("/chat", chatRoute);
//DB Config & Listner

mongoose.connect(connection_url)
    .then(() => { console.log(`Connected to DB.!`) })
    .then(() => {
        app.listen(PORT, () => { console.log(`Listening on Port : ${PORT}`) })
    });
//Setting-Up changeStream to watch changes in our database

//Set Up endpoints
app.get('/', (req, res) => {
    res.status(200).send("This APi is Live & Working");
})
