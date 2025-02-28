const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderModel'
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['Radiologist', 'RadiologyCenter']
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'receiverModel'
  },
  receiverModel: {
    type: String,
    required: true,
    enum: ['Radiologist', 'RadiologyCenter']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true
  },
  readStatus: {
    type: Boolean,
    default: false
  },
  attachments: [{
    fileName: String,
    fileType: String,
    filePath: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ readStatus: 1 });

module.exports = mongoose.model('Message', messageSchema);