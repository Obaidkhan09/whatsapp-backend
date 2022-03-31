import express from "express";
import joi from "joi";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import userSchema from "../schema/users.js"

const router = express.Router();

const check = (req, res) => {
    res.status(200).send("SignUp is Live.!");
}

const signUp = async (req, res) => {
    const schema = joi.object({
        name: joi.string().min(3).max(30).required(),
        email: joi.string().email().min(3).max(30).required(),
        password: joi.string().min(5).max(100).required()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        res.status(422).send(error.details[0].message);
    }
    try {
        const temp = await userSchema.findOne({ email: req.body.email });
        if (temp) {
            res.status(409).send("User Already Exists");
        }
        const { name, email, password } = req.body;
        let user = new userSchema({
            name,
            email,
            password
        });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        user.save();
        const secretKey = process.env.REACT_APP_JWT_SECRET;
        const token = jwt.sign({ _id: user._id, name: user.name, email: user.email }, secretKey);
        res.status(201).send(token);
    } catch (error) {
        res.status(404).send("Error Occured", error.message);
    }
}


router.get("/", check);
router.post("/",signUp);
export default router;