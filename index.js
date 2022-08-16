const express = require('express');
const mongoose = require('mongoose');
const bcryppt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

mongoose.connect(process.env.URL_DB)

const app = express();

app.use(express.json());

