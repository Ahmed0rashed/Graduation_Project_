const mongoose = require('mongoose');
const Message = require('../models/Chat.model');
const Radiologist = require('../models/Radiologists.Model');
const RadiologyCenter = require('../models/Radiology_Centers.Model');
const CenterRadiologistsRelation = require("../models/CenterRadiologistsRelation.Model");

const { io, activeUsers } = require("../middleware/socketManager");

exports.io = null; 

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
    
    const newMessage = new Message({
      sender: senderId,
      senderModel: senderType,
      receiver: receiverId,
      receiverModel: receiverType,
      content,
      attachments: attachments || []
    });
    
    await newMessage.save();
    
    if (activeUsers.has(receiverId)) {
      const receiverSocketId = activeUsers.get(receiverId).socketId;
      
      // Get total unread count for the receiver
      const totalUnreadCount = await Message.countDocuments({
        receiver: receiverId,
        receiverModel: receiverType,
        readStatus: false
      });
      
      // Get unread count from this specific sender
      const senderUnreadCount = await Message.countDocuments({
        sender: senderId,
        senderModel: senderType,
        receiver: receiverId,
        receiverModel: receiverType,
        readStatus: false
      });
      
      exports.io.to(receiverSocketId).emit('newMessage', {
        message: newMessage,
        totalUnreadCount,
        senderUnreadCount: {
          senderId,
          senderType,
          count: senderUnreadCount
        }
      });
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

exports.getUnreadCountPerSender = async (req, res) => {
  try {
    const { userId, userType } = req.query;
    
    if (!userId || !userType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters' 
      });
    }
    
    // Validate input
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId format'
      });
    }
    
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Fetch the actual unread messages to inspect
    const unreadMessages = await Message.find({
      receiver: userObjectId,
      receiverModel: userType,
      readStatus: false
    }).lean();
    

    // Manual aggregation to debug
    const manualUnreadCounts = unreadMessages.reduce((acc, message) => {
      const senderId = message.sender.toString();
      const senderModel = message.senderModel;
      
      if (!acc[senderId]) {
        acc[senderId] = {
          senderId,
          senderModel,
          unreadCount: 0
        };
      }
      
      acc[senderId].unreadCount++;
      return acc;
    }, {});
    
    // Convert to array and fetch sender details
    const unreadCountsArray = await Promise.all(
      Object.values(manualUnreadCounts).map(async (item) => {
        try {
          const senderModel = item.senderModel === 'Radiologist' 
            ? Radiologist 
            : RadiologyCenter;
          
          const senderDetails = await senderModel.findById(item.senderId).lean();
          
          return {
            senderId: item.senderId,
            senderModel: item.senderModel,
            senderName: senderDetails?.name || 'Unknown Sender',
            unreadCount: item.unreadCount
          };
        } catch (err) {
          console.error(`Error fetching sender details for ${item.senderId}:`, err);
          return {
            senderId: item.senderId,
            senderModel: item.senderModel,
            senderName: 'Error Fetching Name',
            unreadCount: item.unreadCount
          };
        }
      })
    );
    
    return res.status(200).json({
      success: true,
      unreadCounts: unreadCountsArray,
      totalUnreadMessageCount: unreadMessages.length
    });
  } catch (error) {
    console.error('Full Error in getUnreadCountPerSender:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error retrieving unread count per sender',
      error: error.message,
      errorStack: error.stack
    });
  }
};
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
exports.getUnreadCountAndRadiologists = async (req, res) => {
  try {
    const { userId, userType, centerId, page = 1, limit = 10 } = req.query;

    if (!userId || !userType || !centerId) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters (userId, userType, centerId)",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(centerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId or centerId format",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const centerObjectId = new mongoose.Types.ObjectId(centerId);

    // Fetch unread messages received by this user
    const unreadMessages = await Message.find({
      receiver: userObjectId,
      receiverModel: userType,
      readStatus: false,
    }).lean();

    // Count unread messages for each sender
    const unreadCounts = unreadMessages.reduce((acc, message) => {
      const senderId = message.sender.toString();
      if (!acc[senderId]) {
        acc[senderId] = 0;
      }
      acc[senderId]++;
      return acc;
    }, {});

    // Fetch radiologists linked to the center
    const skip = (page - 1) * limit;
    const centerRadiologists = await CenterRadiologistsRelation.findOne({
      center: centerObjectId,
    }).populate({
      path: "radiologists",
      select: "firstName lastName status image",
      options: {
        skip: skip,
        limit: parseInt(limit),
        sort: { firstName: 1 },
      },
    })
    .populate("center", "name address");

    if (!centerRadiologists) {
      return res.status(404).json({
        success: false,
        message: "No radiologists found for this center",
      });
    }

    // Attach unread count to each radiologist
    const radiologistsWithUnreadCount = centerRadiologists.radiologists.map((r) => ({
      id: r._id,
      firstName: r.firstName,
      lastName: r.lastName,
      status: r.status,
      imageUrl: r.image,
      unreadCount: unreadCounts[r._id.toString()] || 0, // Default to 0 if no unread messages
    }));

    return res.status(200).json({
      success: true,
      unreadMessages: {
        totalUnreadMessageCount: unreadMessages.length,
      },
      radiologists: radiologistsWithUnreadCount,
    });
  } catch (error) {
    console.error("Error in getUnreadCountAndRadiologists:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving data",
      error: error.message,
    });
  }
};
