import express from "express";
import usersSchema from "../schema/users.js";

const router = express.Router();

const fetchAllUsers = (req, res) => {
    usersSchema.find({}, {_id:1, name:1, email:1}).sort({name : 1}).then((data, err) => {
        if (data) {
            return res.status(200).send(data);
        }
        else {
            return res.status(500).send(err);
        }
    })
}

router.get("/", fetchAllUsers);

export default router;