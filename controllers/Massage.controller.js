const Message = require('../models/Chat.model');
const Radiologist = require('../models/Radiologists.Model');
const RadiologyCenter = require('../models/Radiology_Centers.Model');
// const activeUsers = require('../server');
// تخزين المستخدمين النشطين
// const Message = require("../models/Chat.model");
// const { io, activeUsers } = require("../socket/socketManager");

const activeUsers = new Map();

// تصدير لاستخدامه في ملفات أخرى
exports.io = null; // استبدل بمثيل io الخاص بك الفعلي

exports.setSocketIO = (socketIO) => {
  exports.io = socketIO;
};

exports.getConversation = async (req, res) => {
  try {
    const { userId, userType, partnerId, partnerType } = req.query;
    
    if (!userId || !userType || !partnerId || !partnerType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters' 
      });
    }
    
    const userExists = userType === 'Radiologist' 
      ? await Radiologist.exists({ _id: userId })
      : await RadiologyCenter.exists({ _id: userId });
      
    const partnerExists = partnerType === 'Radiologist'
      ? await Radiologist.exists({ _id: partnerId })
      : await RadiologyCenter.exists({ _id: partnerId });
      
    if (!userExists || !partnerExists) {
      return res.status(404).json({
        success: false,
        message: 'One or both conversation participants do not exist'
      });
    }
    
    const messages = await Message.find({
      $or: [
        { 
          sender: userId, 
          senderModel: userType, 
          receiver: partnerId, 
          receiverModel: partnerType 
        },
        { 
          sender: partnerId, 
          senderModel: partnerType, 
          receiver: userId, 
          receiverModel: userType 
        }
      ]
    }).sort({ createdAt: 1 });

    // تحديث الرسائل كمقروءة
    const updatedDocs = await Message.updateMany(
      { 
        sender: partnerId, 
        senderModel: partnerType,
        receiver: userId,
        receiverModel: userType,
        readStatus: false
      },
      { readStatus: true }
    );
    
    // إخطار المرسل أن الرسائل قد تمت قراءتها إذا كان متصلاً
    if (updatedDocs.modifiedCount > 0 && activeUsers.has(partnerId)) {
      const partnerSocketId = activeUsers.get(partnerId).socketId;
      exports.io.to(partnerSocketId).emit('messagesRead', {
        partnerId: userId,
        partnerType: userType
      });
    }
    
    return res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving conversation',
      error: error.message
    });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { 
      senderId, 
      senderType, 
      receiverId, 
      receiverType, 
      content,
      attachments 
    } = req.body;
    
    if (!senderId || !senderType || !receiverId || !receiverType || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters' 
      });
    }
    
    const senderExists = senderType === 'Radiologist' 
      ? await Radiologist.exists({ _id: senderId })
      : await RadiologyCenter.exists({ _id: senderId });
      
    const receiverExists = receiverType === 'Radiologist'
      ? await Radiologist.exists({ _id: receiverId })
      : await RadiologyCenter.exists({ _id: receiverId });
      
    if (!senderExists || !receiverExists) {
      return res.status(404).json({
        success: false,
        message: 'One or both conversation participants do not exist'
      });
    }
    
    // إنشاء رسالة جديدة
    const newMessage = new Message({
      sender: senderId,
      senderModel: senderType,
      receiver: receiverId,
      receiverModel: receiverType,
      content,
      attachments: attachments || []
    });
    
    await newMessage.save();
    
    // إرسال حدث socket إذا كان المستلم متصلاً
    if (activeUsers.has(receiverId)) {
      const receiverSocketId = activeUsers.get(receiverId).socketId;
      exports.io.to(receiverSocketId).emit('newMessage11', newMessage);
      // io.emit('newMessage55', newMessage); 
      


    }
    
    return res.status(201).json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const { userId, userType } = req.query;
    
    if (!userId || !userType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters' 
      });
    }
    
    const count = await Message.countDocuments({
      receiver: userId,
      receiverModel: userType,
      readStatus: false
    });
    
    return res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving unread count',
      error: error.message
    });
  }
};

// طريقة جديدة لتعليم الرسائل كمقروءة باستخدام Socket.IO
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { userId, userType, partnerId, partnerType } = req.body;
    
    if (!userId || !userType || !partnerId || !partnerType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters' 
      });
    }
    
    const result = await Message.updateMany(
      { 
        sender: partnerId, 
        senderModel: partnerType,
        receiver: userId,
        receiverModel: userType,
        readStatus: false
      },
      { readStatus: true }
    );
    
    // إخطار المرسل أن الرسائل قد تمت قراءتها إذا كان متصلاً
    if (result.modifiedCount > 0 && activeUsers.has(partnerId)) {
      const partnerSocketId = activeUsers.get(partnerId).socketId;
      exports.io.to(partnerSocketId).emit('messagesRead', {
        partnerId: userId,
        partnerType: userType
      });
    }
    
    return res.status(200).json({
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error marking messages as read',
      error: error.message
    });
  }
};