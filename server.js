import express from "express";
import mongoose from "mongoose";
import cors from 'cors';
import 'dotenv/config';
import Pusher from 'pusher';
import Messages from './schema/messagesSchema.js'

import signUp from "./routes/signUp.js";
import signIn from "./routes/signIn.js"
//app Config
const app = express();
const PORT = process.env.PORT || 5000;
const connection_url = `mongodb+srv://tinderadmin:${process.env.REACT_APP_PASSWORD}@cluster0.g0dgp.mongodb.net/whatsappdb?retryWrites=true&w=majority`
const pusher = new Pusher({
    appId: "1367256",
    key: "f184ba8bbbd8b8c5f0c7",
    secret: `${process.env.REACT_APP_PUSHER_SECRET}`,
    cluster: "ap2",
    useTLS: true
});
//middleware Config
app.use(cors());
app.use(express.json());

app.use("/api/signUp", signUp);
app.use("/api/signIn", signIn);
//DB Config & Listner

mongoose.connect(connection_url)
    .then(() => { console.log(`Connected to DB.!`) })
    .then(() => {
        app.listen(PORT, () => { console.log(`Listening on Port : ${PORT}`) })
    });
//Setting-Up changeStream to watch changes in our database
try {
    const db = mongoose.connection;
db.once('open', () => {
    console.log(`DB Connected`);
    const msgCollection = db.collection("messagescontents");
    const changeStream = msgCollection.watch();
    changeStream.on("change", (change) => {

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", {
                _id: messageDetails._id,
                name: messageDetails.name,
                messages: messageDetails.messages,
                timeStamp: messageDetails.timeStamp,
                received: messageDetails.received
            });
        }
    });
})
} catch (error) {
    console.log("Error Triggering Pusher");
}

//Set Up endpoints
app.get('/', (req, res) => {
    res.status(200).send("This APi is Live & Working");
})

app.post('/messages/new', (req, res) => {
    const dbMessages = req.body;
    Messages.create(dbMessages, (err, data) => {
        if (err) {
            res.status(500).send(err)
        }
        else {
            res.status(201).send(data);
        }
    });
});
app.get('/messages/sync', (req, res) => {
    try {
        Messages.find().sort({ _id: -1 }).then((data, err) => {
            if (data) {
                res.status(200).send(data);
            }
            else {
                res.status(500).send(err);
            }
        });
    } catch (error) {
        res.status(500).send("An Error Occured While Fetching From DB..!")
    }
})