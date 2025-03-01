const express = require('express');
const { 
  getConversation, 
  sendMessage, 
  getRadiologistsByCenter,
  getUnreadCount
} = require('../controllers/Massage.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateUser);

router.get('/conversation', getConversation);

router.post('/send', sendMessage);

router.get('/unread', getUnreadCount);

module.exports = router;