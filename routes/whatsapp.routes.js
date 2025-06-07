// routes/messageRoutes.js

const express = require('express');
const router = express.Router();
const { sendMessage } = require('../controllers/whatsapp.controller');

router.post('/send', sendMessage);

module.exports = router;
