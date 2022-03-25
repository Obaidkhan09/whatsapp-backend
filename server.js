import express from "express";
import mongoose from "mongoose";
import cors from 'cors';
import 'dotenv/config';
import Pusher from 'pusher';
import Messages from './schema/messagesSchema.js'

//app Config
const app = express();
const PORT = process.env.PORT || 5000;
const connection_url = `mongodb+srv://tinderadmin:${process.env.REACT_APP_PASSWORD}@cluster0.g0dgp.mongodb.net/whatsappdb?retryWrites=true&w=majority`
const pusher = new Pusher({
    appId: "1367256",
    key: "f184ba8bbbd8b8c5f0c7",
    secret: "ab73a53a975f58761553",
    cluster: "ap2",
    useTLS: true
});
//middleware Config
app.use(cors());
app.use(express.json());

//DB Config & Listner

mongoose.connect(connection_url)
    .then(() => { console.log(`Connected to DB.!`) })
    .then(() => {
        app.listen(PORT, () => { console.log(`Listening on Port : ${PORT}`) })
    });
//Setting-Up changeStream to watch changes in our database
const db = mongoose.connection;
db.once('open', ()=> {
    console.log(`DB Connected`);
    
    const msgCollection = db.collection("messagescontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change)=> {
        console.log(change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", {
                name : messageDetails.name,
                message : messageDetails.messages,
            });
        }
        else {
            console.log("Error Triggering Pusher");
        }
    });
})
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
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err);
        }
        else {
            res.status(200).send(data);
        }
    });
})