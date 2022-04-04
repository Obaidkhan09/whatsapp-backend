import express from "express";
import MessagesSchema from "../schema/messagesSchema.js";
import 'dotenv/config';
import Pusher from 'pusher';
import mongoose from "mongoose";

const router = express.Router();

const connection_url = `mongodb+srv://tinderadmin:${process.env.REACT_APP_PASSWORD}@cluster0.g0dgp.mongodb.net/whatsappdb?retryWrites=true&w=majority`
const pusher = new Pusher({
    appId: "1367256",
    key: "f184ba8bbbd8b8c5f0c7",
    secret: `${process.env.REACT_APP_PUSHER_SECRET}`,
    cluster: "ap2",
    useTLS: true
});

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

const newMessage = (req, res) => {
    const dbMessages = req.body;
    MessagesSchema.create(dbMessages, (err, data) => {
        if (err) {
            res.status(500).send(err)
        }
        else {
            res.status(201).send(data);
        }
    });
};
const syncMessage = (req, res) => {
    try {
        MessagesSchema.find().sort({ _id: -1 }).then((data, err) => {
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
};


router.post("/new", newMessage);
router.get("/sync", syncMessage);

export default router;