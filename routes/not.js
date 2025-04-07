
const express = require('express');
const router = express.Router();
const notificationManager = require('../middleware/notfi');
const Notification = require('../models/not.model');


const checkInitialization = (req, res, next) => {
    if (!notificationManager.isInitialized) {
        return res.status(503).json({
            success: false,
            error: "Notification service is not ready"
        });
    }
    next();
};

router.post('/send', checkInitialization, async (req, res) => {
    try {
        const { userId, userType, title, message } = req.body;

        if (!userId || !userType || !title || !message) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, userType, title, message'
            });
        }

        const result = await notificationManager.sendNotification(
            userId,
            userType,
            title,
            message
        );
        res.json({
            data: result
        });
        await result.save();
    } catch (error) {
        console.error('Notification error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/:userId', checkInitialization, async (req, res) => {
    try {
        const notifications = await notificationManager.getUnreadNotifications(req.params.userId);
        res.json({ 
            success: true, 
            count: notifications.length,
            notifications 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

router.put('/read/:id', checkInitialization, async (req, res) => {
    try {
        const success = await notificationManager.markAsRead(req.params.id);
        res.json({ 
            success: true,
            updated: success 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});




module.exports = router;