const express = require('express');
const { 
  getConversation, 
  sendMessage, 
  getRadiologistsByCenter,
  getUnreadCount,
  markMessagesAsRead,
  getUnreadCountPerSender,
  getUnreadCountAndRadiologists,
  getUnreadCountAndCenters,
  getUnreadCountBetweenRadiologists
} = require('../controllers/Massage.controller');
const { authenticateUser } = require('../middleware/Auth.middleware');

const router = express.Router();

// router.use(authenticateUser);

router.get('/conversation', getConversation);

router.post('/send', sendMessage);

router.get('/unread', getUnreadCount);  

router.post('/markRead', markMessagesAsRead);

router.get('/unread-count', getUnreadCountPerSender);

router.get('/RadiologistListChat', getUnreadCountAndRadiologists);

router.get('/CenterListChat', getUnreadCountAndCenters);

router.get('/RadiologistChat', getUnreadCountBetweenRadiologists);
module.exports = router;