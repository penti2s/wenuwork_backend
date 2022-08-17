const mongoose = require('mongoose');

const Personajes = mongoose.model('personajes', {
    id_user: {type: String, required: true},
    id_personaje: {type: Array, required: true},
})

module.exports = Personajes;