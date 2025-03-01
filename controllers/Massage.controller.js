const Message = require('../models/Chat.model');
const Radiologist = require('../models/Radiologists.Model');
const RadiologyCenter = require('../models/Radiology_Centers.Model');


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

    await Message.updateMany(
      { 
        sender: partnerId, 
        senderModel: partnerType,
        receiver: userId,
        receiverModel: userType,
        readStatus: false
      },
      { readStatus: true }
    );
    
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
    
    // If radiologist is messaging, verify they belong to the center
    // if (senderType === 'Radiologist' && receiverType === 'RadiologyCenter') {
    //   const radiologist = await Radiologist.findById(senderId);
    //   if (radiologist.center.toString() !== receiverId) {
    //     return res.status(403).json({
    //       success: false,
    //       message: 'Radiologist does not belong to this center'
    //     });
    //   }
    // }
    
    // Create new message
    const newMessage = new Message({
      sender: senderId,
      senderModel: senderType,
      receiver: receiverId,
      receiverModel: receiverType,
      content,
      attachments: attachments || []
    });
    
    await newMessage.save();
    
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