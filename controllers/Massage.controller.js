const mongoose = require('mongoose');
const Message = require('../models/Chat.model');
const Radiologist = require('../models/Radiologists.Model');
const RadiologyCenter = require('../models/Radiology_Centers.Model');
const CenterRadiologistsRelation = require("../models/CenterRadiologistsRelation.Model");
const notificationManager = require('../middleware/notfi');
const Notification = require('../models/not.model');

// Get activeUsers from notification manager
const getActiveUsers = () => notificationManager.activeUsers;

exports.io = null; 

exports.setSocketIO = (socketIO) => {
  exports.io = socketIO;
};

const sendNotification = async (userId, userType, title, message,image,centername) => {
  try {
    const result = await notificationManager.sendNotification(
      userId,
      userType,
      title,
      message,
      image,
      centername,
      type = "massage"
    );

    return result;
  } catch (error) {
    console.error("Notification error:", error);
    throw error;
  }
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
    
    
    if (updatedDocs.modifiedCount > 0) {
      // Get conversation room ID for broadcasting
      const conversationRoomId = notificationManager.getConversationRoomId(
        userId, userType, partnerId, partnerType
      );
      
      // Broadcast to conversation room
      exports.io.to(conversationRoomId).emit('messagesRead', {
        partnerId: userId,
        partnerType: userType,
        conversationRoomId
      });
      
      // Also send to individual user if online
      if (getActiveUsers().has(partnerId)) {
        const partnerSocketId = getActiveUsers().get(partnerId).socketId;
        exports.io.to(partnerSocketId).emit('messagesRead', {
          partnerId: userId,
          partnerType: userType
        });
      }
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

let oldcontact = "";
    const oldNotification = await Notification.findOne({
      userId: receiverId,
      type: "massage",  
    });
    if (oldNotification) {
        oldcontact =  oldNotification.message +"\n ";
    }
    // console.log("oldNotification", oldNotification);

    const newMessage = new Message({
      sender: senderId,
      senderModel: senderType,
      receiver: receiverId,
      receiverModel: receiverType,
      content,
      attachments: attachments || []
    });

    await newMessage.save();
    let notification;
    let senderName;
    if (senderType === 'Radiologist') {
      const radiologist = await Radiologist.findById(senderId).select('firstName lastName image');
      senderName = `${radiologist.firstName} ${radiologist.lastName}`;
      notification = await sendNotification(receiverId, "Radiologist", radiologist.firstName,oldcontact+content,radiologist.image,radiologist.firstName + " " + radiologist.lastName); 
    } else {
      const center = await RadiologyCenter.findById(senderId).select('centerName image');
      senderName = center.centerName;
      notification = await sendNotification(receiverId, "RadiologyCenter", center.centerName ,oldcontact +content,center.image,center.centerName);

    }

    await Notification.findByIdAndDelete(oldNotification._id);



    if (notification.save) {
      await notification.save(); 
    }
    
    // Get conversation room ID for broadcasting
    const conversationRoomId = notificationManager.getConversationRoomId(
      senderId, senderType, receiverId, receiverType
    );
    
    // Broadcast to conversation room
    exports.io.to(conversationRoomId).emit('newMessage', {
      message: newMessage,
      conversationRoomId
    });
    
    // Also send to individual user if online
    if (getActiveUsers().has(receiverId)) {
      const receiverSocketId = getActiveUsers().get(receiverId).socketId;
      
      const totalUnreadCount = await Message.countDocuments({
        receiver: receiverId,
        receiverModel: receiverType,
        readStatus: false
      });
      
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
    
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId format'
      });
    }
    
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    
    const unreadMessages = await Message.find({
      receiver: userObjectId,
      receiverModel: userType,
      readStatus: false
    }).lean();
    

   
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
    
    if (result.modifiedCount > 0) {
      // Get conversation room ID for broadcasting
      const conversationRoomId = notificationManager.getConversationRoomId(
        userId, userType, partnerId, partnerType
      );
      
      // Broadcast to conversation room
      exports.io.to(conversationRoomId).emit('messagesRead', {
        partnerId: userId,
        partnerType: userType,
        conversationRoomId
      });
      
      // Also send to individual user if online
      if (getActiveUsers().has(partnerId)) {
        const partnerSocketId = getActiveUsers().get(partnerId).socketId;
        exports.io.to(partnerSocketId).emit('messagesRead', {
          partnerId: userId,
          partnerType: userType
        });
      }
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
    const { userId, userType, page = 1, limit = 10 } = req.query;

    if (!userId || !userType || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters (userId, userType, centerId)",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId or centerId format",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const centerObjectId = new mongoose.Types.ObjectId(userId);


    const unreadMessages = await Message.find({
      receiver: userObjectId,
      receiverModel: userType,
      readStatus: false,
    }).lean();

   
    const unreadCounts = unreadMessages.reduce((acc, message) => {
      const senderId = message.sender.toString();
      if (!acc[senderId]) {
        acc[senderId] = 0;
      }
      acc[senderId]++;
      return acc;
    }, {});

    
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

    
    const radiologistsWithUnreadCount = centerRadiologists.radiologists.map((r) => ({
      id: r._id,
      firstName: r.firstName,
      lastName: r.lastName,
      status: r.status,
      imageUrl: r.image,
      unreadCount: unreadCounts[r._id.toString()] || 0, 
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

exports.getUnreadCountAndCenters = async (req, res) => {
  try {
    const { userId, userType } = req.query;

    if (!userId || !userType) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters (userId, userType)",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId format",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    
    const unreadMessages = await Message.find({
      receiver: userObjectId,
      receiverModel: userType,
      readStatus: false,
    }).lean();

    
    const manualUnreadCounts = unreadMessages.reduce((acc, message) => {
      const senderId = message.sender.toString();
      const senderModel = message.senderModel;

      if (!acc[senderId]) {
        acc[senderId] = {
          senderId,
          senderModel,
          unreadCount: 0,
        };
      }
      acc[senderId].unreadCount++;
      return acc;
    }, {});

    
    const unreadCountMap = new Map(
      Object.values(manualUnreadCounts).map((item) => [item.senderId, item.unreadCount])
    );

    
    const centers = await CenterRadiologistsRelation.findByRadiologist(userId);

    const centersWithUnread = await Promise.all(
      centers.map(async (centerRelation) => {
        const center = centerRelation.center;
        const centerUnreadCount = unreadCountMap.get(center._id.toString()) || 0;

        const centerRadiologists = await Radiologist.find({
          _id: { $in: centerRelation.radiologists },
        }).select("_id firstName lastName email image").lean();

        
        const radiologistsWithUnread = centerRadiologists.map((r) => ({
          _id: r._id,
          name: `${r.firstName} ${r.lastName}`,
          email: r.email,
          image: r.image,
          unreadCount: unreadCountMap.get(r._id.toString()) || 0,
        }));

        return {
          id: center._id,
          centerName: center.centerName,
          imageUrl: center.image,
          address: center.address,
          unreadCount: centerUnreadCount,
          radiologists: radiologistsWithUnread,
        };
      })
    );

    return res.status(200).json({
      success: true,
      unreadMessages: {
        totalUnreadMessageCount: unreadMessages.length,
      },
      centers: centersWithUnread,
    });
  } catch (error) {
    console.error("Error in getUnreadCountAndCenters:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving data",
      error: error.message,
      errorStack: error.stack,
    });
  }
};


exports.getUnreadCountBetweenRadiologists = async (req, res) => {
  try {
    const { userId, userType, radiologistId, page = 1, limit = 10 } = req.query;

    if (!userId || !userType || !radiologistId) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters (userId, userType, radiologistId)",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(radiologistId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId or radiologistId format",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const targetRadiologistId = new mongoose.Types.ObjectId(radiologistId);

    
    const unreadMessages = await Message.find({
      receiver: userObjectId,
      sender: targetRadiologistId,
      receiverModel: "Radiologist",
      readStatus: false,
    }).lean();

   
    const unreadCount = unreadMessages.length;

    
    const targetRadiologist = await Radiologist.findById(targetRadiologistId).select("firstName lastName status image");

    if (!targetRadiologist) {
      return res.status(404).json({
        success: false,
        message: "No radiologists found for this radiologist",
      });
    }

    return res.status(200).json({
      success: true,
      unreadMessages: {
        totalUnreadMessageCount: unreadCount,
      },
      radiologist: {
        id: targetRadiologist._id,
        firstName: targetRadiologist.firstName,
        lastName: targetRadiologist.lastName,
        status: targetRadiologist.status,
        imageUrl: targetRadiologist.image,
      },
    });
  } catch (error) {
    console.error("Error in getUnreadCountBetweenRadiologists:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving data",
      error: error.message,
    });
  }
};
