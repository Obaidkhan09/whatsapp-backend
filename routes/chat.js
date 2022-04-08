import express from "express";
import chatSchema from "../schema/chatSchema.js"
import 'dotenv/config';
import Pusher from 'pusher';
import mongoose from "mongoose";


const router = express.Router();
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
        const msgCollection = db.collection("chats");
        const changeStream = msgCollection.watch();
        changeStream.on("change", (change) => {

            if (change.operationType === 'insert') {
                const messageDetails = change.fullDocument;
                pusher.trigger("chat", "inserted", {
                    _id: messageDetails._id,
                    name: messageDetails.name,
                    messages: messageDetails.messages,
                    timeStamp: messageDetails.timeStamp,
                    received: messageDetails.received
                });
            }
            // console.log(change.updateDescription.updatedFields[Object.keys(change.updateDescription.updatedFields)[0]])
            if (change.operationType === 'update') {
                const messageDetails = change.updateDescription.updatedFields[Object.keys(change.updateDescription.updatedFields)[0]];
                pusher.trigger("chat", "updated", {
                    _id: messageDetails._id,
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timeStamp: messageDetails.timeStamp,
                    sender: messageDetails.sender
                });
            }
        });
    })
} catch (error) {
    console.log("Error Triggering Pusher");
}

const chatNew = async (req, res) => {
    // console.log(req.body)
    const data = req.body;
    const user = data.members;
    const message = data.messages;
    console.log(user[0], user[1]);

    const db = await chatSchema.findOne({ $or: [{ members: [user[0], user[1]] }, { members: [user[1], user[0]] }] });
    // console.log(db);
    // console.log(message);
    if (db) {
        console.log('db',db)
        // console.log('message',message)
        chatSchema.updateOne({ _id: db._id }, { $push: { messages: message } }, { new: true }, (err, updated) => {
            return res.status(200).send(updated);
        });
    }
    else {
        console.log(data);
        chatSchema.create(data, (err, resp) => {
            if (err) {
                console.log("err", err)
                return res.status(500).send(err);
            }
            else {
                console.log("res", resp)
                res.status(200).send(resp);
            }
        });
    }
}

const chatSync = (req, res) => {
    const { user1, user2 } = req.query;
    // console.log(req.query)
    try {
        // {member:{$in:['Obaid','user']}}
        chatSchema.find({ $or: [{ members: [user1, user2] }, { members: [user2, user1] }] }).then((data) => {
            // console.log(data);
            res.status(200).send(data[0].messages)
        })
    } catch (error) {
        // console.log(error);
        res.status(500).send(error);
    }
}

const allDocs = async (req, res) => {
    // const { user1, user2 } = req.query;
    // const response = await chatSchema.find({ $or: [{ members: [user1, user2] }, { members: [user2, user1] }] }, { members: 1, messages: 1, receiver: 1, sender: 1 });
    // const data = response.map((items) => {
    //     const messages = items.messages.splice(-1);
    //     const members = items.members;
    //     const sender = items.sender;
    //     const receiver = items.receiver;
    //     const _id = items._id;
    //     return { _id, members, messages, sender, receiver }
    // })
    const { user } = req.query;
    // console.log(req.query)
    try {
        chatSchema.find().then((response) => {
            const data = response.filter((items) => {
                if (items.members[0] == user || items.members[1] == user) {
                    // console.log(items.members)
                    return items;
                }
            });
            res.status(200).send(data)
        })
    } catch (error) {
        // console.log(error);
        res.status(500).send(error);
    }
    // res.status(200).send(data);
}

router.post("/new", chatNew);
router.get("/sync", chatSync);
router.get("/alldocs", allDocs);

export default router;