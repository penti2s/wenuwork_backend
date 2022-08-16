const express = require('express');
const mongoose = require('mongoose');
const bcryppt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios').default;
const User = require('./Models/user');
const Personajes = require('./Models/favPersonajes');
const passport = require('passport');
const ExtractJWT = require('passport-jwt').ExtractJwt;
const JWTstrategy = require('passport-jwt').Strategy;

require('dotenv').config();

mongoose.connect(process.env.URL_DB)

const app = express();

app.use(express.json());

const firmaDeToken = _id => jwt.sign({ _id }, process.env.JWT_SECRET);

passport.use(
    new JWTstrategy(
        {
            secretOrKey: process.env.JWT_SECRET,
            jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
            algorithms: ['HS256']
        },
        async (token, done) => {
            try {
                return await done(token._id);
            } catch (error) {
                done(error);
            }
        }
    )
);

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

app.post('/login', async (req, res) => {
    const { body } = req;
    try {
        const usuario = await User.findOne({ email: body.email });
        if (usuario) {
            const isMatch = await bcryppt.compare(body.password, usuario.password);
            if (isMatch) {
                const tokenFirmado = firmaDeToken(usuario._id);
                console.log('login')
                res.status(200).send(tokenFirmado);
            } else {
                res.status(400).send({ message: 'Usuario o contraseña incorrectos' });
            }
        } else {
            res.status(400).send({ message: 'Usuario o contraseña incorrectos' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
});

//create middleware con passport-jwt y passport
app.get('/save', (req, res, next) => {
    passport.authenticate("jwt", { session: false }, (payload) => {
        req.userToken = payload;
        next();
    })(req, res, next);
}, async (req, res) => { 
    // Guardar favoritos
    const { body, userToken } = req
    const agregarPersonajeFav = await Personajes.create({ id_user: userToken, id_personaje: body.id_personaje })
    //res.status(200).send(agregarPersonajeFav)
    res.send('test')
})


app.get('/allpersonajes', (req, res) => {
    axios.get('https://rickandmortyapi.com/api/character')
    .then((response) => {
        res.status(200).json(response.data.results)
    })
    .catch((error) => {
        console.log('sadsa')
        console.log(error);
    })
})

app.listen(3000, () => {
    console.log('Server on port 3000');
})