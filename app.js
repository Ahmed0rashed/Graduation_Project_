const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const pationtRouter = require('./routes/pationt.routes');
const app = express();


app.use(cors());

app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/api/patients", pationtRouter);
module.exports = app;
