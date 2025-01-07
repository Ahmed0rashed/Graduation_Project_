const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const userRouter = require('./routes/user.routes');

const app = express();


app.use(cors());

app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/users', userRouter);

module.exports = app;
