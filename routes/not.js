
const express = require('express');
const router = express.Router();
const notificationManager = require('../middleware/notfi');
const Notification = require('../models/not.model');
const RadiologyCenter = require('../models/Radiology_Centers.Model');

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
        const { userId, userType, title, message,centerid,type } = req.body;

        if (!userId || !userType || !title || !message  || !type) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, userType, title, message'
            });
        }
          const center = await RadiologyCenter.findById(centerid);

        const result = await notificationManager.sendNotification(
            userId,
            userType,
            title,
            message,
            center.image,
            center.centerName,
            type,
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
router.get('/all/:userId', checkInitialization, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 });
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
router.delete('/:id', checkInitialization, async (req, res) => {
    try {
        const deleted = await Notification.findByIdAndDelete(req.params.id);
        res.json({ 
            success: true, 
            deleted 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});
router.delete('/all/:userId', checkInitialization, async (req, res) => {
    try {
        const deleted = await Notification.deleteMany({ userId: req.params.userId });
        res.json({ 
            success: true, 
            deleted 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

router.put('/all/read/:userId', checkInitialization, async (req, res) => {
    try {
        const updated = await Notification.updateMany({ userId: req.params.userId }, { isRead: true });
        res.json({ 
            success: true, 
            updated 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});


router.put('/make_all_read', checkInitialization, async (req, res) => {
    try {
        const updated = await Notification.updateMany({ userId: req.body.userId, type: req.body.type }, { isRead: true });
        res.json({ 
            success: true, 
            updated 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});


module.exports = router;