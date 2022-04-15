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
                    members: messageDetails.members,
                    messages: messageDetails.messages,
                    timeStamp: messageDetails.timeStamp,
                    sender: messageDetails.sender,
                    receiver : messageDetails.receiver
                });
                // console.log(messageDetails);
            }
            // console.log(change.updateDescription.updatedFields[Object.keys(change.updateDescription.updatedFields)[0]])
            if (change.operationType === 'update') {
                const messageDetails = change.updateDescription.updatedFields[Object.keys(change.updateDescription.updatedFields)[0]];
                pusher.trigger("chat", "updated", {
                    _id: messageDetails._id,
                    message: messageDetails.message,
                    timeStamp: messageDetails.timeStamp,
                    sender: messageDetails.sender
                });
            }
            if (change.operationType === 'delete') {
                pusher.trigger("chat", "deleted", {
                   result : "success"
                });
                // console.log(messageDetails);
            }
        });
    })
} catch (error) {
    console.log("Error Triggering Pusher");
}

const chatNew = async (req, res) => {
    console.log("HEREEEEEEEEE",req.body)
    const data = req.body;
    const user = data.members;
    const message = data.messages;
    // console.log(user[0], user[1]);

    const db = await chatSchema.findOne({ $or: [{ members: [user[0], user[1]] }, { members: [user[1], user[0]] }] });
    // console.log(db);
    // console.log(message);
    if (db) {
        // console.log('db',db)
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
                console.log("response")
                res.status(200).send(resp);
            }
        });
    }
}

const chatSync = (req, res) => {
    const { user1, user2 } = req.query;
    // console.log("check check check",user1, user2)
    try {
        // {member:{$in:['Obaid','user']}}
        chatSchema.find({ $or: [{ members: [user1, user2] }, { members: [user2, user1] }] }).then((data) => {
            // console.log(data);
            res.status(200).send(data);
        })
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}

const allDocs = async (req, res) => {

    const { user } = req.query;
    // console.log(req.query)
    try {
        chatSchema.find().then((response) => {
            let data = response.filter((items) => {
                if (items.members[0] == user || items.members[1] == user) {
                    // console.log(items.members)
                    return items;
                }
            });
            // data.sort((a, b) => new Date(a.timeStamp) > new Date(b.timeStamp ? 1 : -1) )
            // console.log(data)
            // const temp =  data.sort((a,b) => (a.messages[a.messages.length - 1].timeStamp < b.messages[b.messages.length - 1].timeStamp) ? -1 : 1 )
            let temp = {}

            if (data.length >= 2) {
                for (let i = 0; i < data.length - 1; i++) {
                    for (let j = 1; j < data.length; j++) {
                        // console.log('data[j]', data[j].messages)
                        // console.log(data[i].messages[data[i].messages.length-1].timeStamp <   data[i + 1].messages[data[i + 1].messages.length-1].timeStamp);
                        // if(data[j].messages[data[j].length] !== 0 && data[j].messages[0] !=null){}
                        if (data[i].messages[data[i].messages.length - 1].timeStamp < data[j].messages[data[j].messages.length - 1].timeStamp) {
                            temp = data[i];
                            data[i] = data[j];
                            data[j] = temp;
                        }
                    }
                }
            }
            // console.log(dataSort);
            res.status(200).send(data)
        })
    } catch (error) {
        // console.log(error);
        res.status(500).send(error);
    }
}

const deleteDoc = async(req, res) => {
    const {id} = req.query;
    console.log(id);
    try{

        chatSchema.findByIdAndDelete(id, (err, docs)=> {
            if (err) {
                console.log("ERR",err);
            }
            else{
                console.log("DOCS",docs);
            }
        });
        res.status(200).send("Success");
    }
    catch (error) {
        res.status(404).send("Not Found");
    }
}

router.post("/new", chatNew);
router.get("/sync", chatSync);
router.get("/alldocs", allDocs);
router.delete("/delete", deleteDoc);

export default router;