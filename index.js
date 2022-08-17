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
const cors = require('cors');

let regex = /^[a-z0-9]+@[a-z]+\.[a-z]{2,3}$/

require('dotenv').config();

mongoose.connect(process.env.URL_DB)

const app = express();

app.use(cors(), express.json());

const firmaDeToken = _id => jwt.sign({ _id }, process.env.JWT_SECRET);

passport.use(
    new JWTstrategy({
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET,
    }, async function (payload, done) {
        try {
            return done(null, payload)
        } catch (err) {
            return done(new Error(), false)
        }
    }),
);



app.post('/register', async (req, res) => {
    const { body } = req;
    try {
        const usuario = await User.findOne({ email: body.email });
        if (usuario ) {
            res.status(400).send({ message: 'El usuario ya existe' });
        } else {
            if(regex.test(body.email)){
                const salt = await bcryppt.genSalt();
                const hashed = await bcryppt.hash(body.password, salt);
                const userCreated = await User.create({ email: body.email, password: hashed, salt });
                const tokenFirmado = firmaDeToken(userCreated._id);
                res.status(200).send(JSON.stringify({ token: tokenFirmado }))
            }else{
                res.status(400).send({message: 'El email no es valido'})
            }
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
                res.status(200).send(JSON.stringify({ token: tokenFirmado }));

            } else {
                res.status(400).send({ message: 'Usuario o contraseña incorrectos' });
            }
        } else {
            res.status(400).send({ message: 'Usuario o contraseña incorrectos' });
        }
    } catch (error) {
        res.status(500).send(error);
    }
});
const isAuthenticated = (req, res, next) => {
    passport.authenticate('jwt', function (err, user) {
        if (err || !user) {
            res.status(400).send('No tienes permiso para entrar a esta ruta');
        } else {
            req.user = user._id;
            next();
        }
    })(req, res, next)}
//create middleware con passport-jwt y passport
app.post('/save', isAuthenticated, async (req, res) => {
    const { body } = req;
    const userSearch = await Personajes.findOne({ id_user: req.user });
    if (userSearch) {
        const { id_personaje } = userSearch
        if(body.new_id_personaje){
            id_personaje.push(body.new_id_personaje);
            await Personajes.findOneAndUpdate({ id_user: req.user },  { id_personaje: id_personaje} )
            res.status(200).send(JSON.stringify({ message: 'Personaje agregado a favoritos' }));
        }else{
            res.status(400).send(JSON.stringify({ message: 'Faltan parametros para agregar personajes' }));
        }
    }else{
        await Personajes.create({ id_user: req.user, id_personaje: [body.new_id_personaje] })
        res.status(200).send(JSON.stringify({ message: 'Personaje agregado a favoritos' }));
    }
});

app.get('/allsaveCharacter', isAuthenticated, async (req, res) => {
    const userSearch = await Personajes.findOne({ id_user: req.user });
    if (userSearch) {
        const { id_personaje } = userSearch
        res.status(200).send(JSON.stringify(id_personaje));
    }else{
        res.status(200).send(JSON.stringify({ message: 'No tienes personajes guardados'}));
    }
});


app.get('/allpersonajes', (req, res) => {
    axios.get('https://rickandmortyapi.com/api/character')
        .then((response) => {
            res.status(200).json(response.data.results)
        })
        .catch((error) => {
            console.log(error);
        })
})



app.listen(process.env.PORT || 3000, () => {
    console.log('Server on port 3000');
})