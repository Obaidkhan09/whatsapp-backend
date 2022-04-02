import express from "express";
import joi from "joi";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import userSchema from "../schema/users.js";

const router = express.Router();

const check = (req, res) => {
    res.status(200).send("Sign In Working..!!");
}

const signIn = async (req, res) => {
    const schema = joi.object({
        email: joi.string().email().min(3).max(30).required(),
        password: joi.string().min(5).max(100).required()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(422).send(error.details[0].message);
    }
    try {
        let user = await userSchema.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).send("User does not Exists.");
        }
        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) {
            return req.status(401).send("Invalid Passwrod Entered");
        }
        const secretKey = process.env.REACT_APP_JWT_SECRET;
        const token = jwt.sign({ _id: user._id, name: user.name, email: user.email }, secretKey);
        res.status(200).send(token);
    }
    catch (error) {
        res.status(404).send(error.message);
    }

}

router.get("/", check);
router.post("/", signIn);

export default router;