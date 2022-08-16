const express = require('express');
const mongoose = require('mongoose');
const bcryppt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios').default;
const User = require('./Models/user');
require('dotenv').config();

mongoose.connect(process.env.URL_DB)

const app = express();

app.use(express.json());

const firmaDeToken = _id => jwt.sign({ _id }, process.env.JWT_SECRET);


app.post('/register', async (req, res) => {
    const { body } = req;
    try {
        const usuario = await User.findOne({ email: body.email });
        if (usuario) {
            res.status(400).send({ message: 'El usuario ya existe' });
        } else {
            const salt = await bcryppt.genSalt();
            const hashed = await bcryppt.hash(body.password, salt);
            const userCreated = await User.create({ email: body.email, password: hashed, salt });
            const tokenFirmado = firmaDeToken(userCreated._id);
            res.status(200).send(tokenFirmado)
        }

    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
})

app.listen(3000, ()=>{
    console.log('Server on port 3000');
})