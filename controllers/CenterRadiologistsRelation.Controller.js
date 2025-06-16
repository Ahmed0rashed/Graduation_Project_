const CenterRadiologistsRelation = require("../models/CenterRadiologistsRelation.Model");
const Radiologist = require("../models/Radiologists.Model");
const RadiologyCenter = require("../models/Radiology_Centers.Model"); 
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");


async function sendInvitationEmail(radiologistEmail, centerName, centerEmail, phone) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "radintelio@gmail.com",
      pass: "iond hchz zpzm bssn", 
    },
  });

  const radiologistName = radiologistEmail.split('@')[0].split('.')[0];  
  
  const mailOptions = {
    from: centerEmail,
    to: radiologistEmail,
    subject: `Invitation to Join Radintal from ${centerName}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f4f4f4;">
        <h2 style="color: #2c3e50;">You're Invited to Join Radintal</h2>
        <p>Dear ${radiologistName},</p>
        
        <p>We at <strong>${centerName}</strong> would like to extend an invitation for you to join <strong>Radintal</strong>, our collaborative platform designed for radiologists.</p>
  
        <p>By joining Radintal, you'll have the opportunity to connect with our team for image consultations, case reviews, and seamless communication, improving the quality and efficiency of your practice.</p>
  
        <p><strong>Contact Information for ${centerName}:</strong></p>
        <p><strong>Email:</strong> <a href="mailto:${centerEmail}" style="color: #3498db;">${centerEmail}</a></p>
        <p><strong>Phone:</strong> ${phone}</p>
  
        <p>If you're interested in joining us on Radintal, please use the contact information above to reach out to us directly. Please note that this is an automated invitation email and responses to this email address will not be monitored.</p>
  
        <p>We would be delighted to have you on board and look forward to collaborating with you!</p>
  
        <p>Best regards,</p>
        <p><strong>${centerName} Team</strong></p>
        <p style="font-size: 12px; color: #7f8c8d;">This is an automated invitation email. Please do not reply to this email address.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Invitation email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}
async function sendInvitationEmail1(radiologistId, radiologistEmail, centerName, centerEmail, phone) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "radintelio@gmail.com",
      pass: "iond hchz zpzm bssn", 
    },
  });

  const radiologistName = radiologistEmail.split('@')[0].split('.')[0];  

  const acceptUrl = `https://graduation-project-mmih.vercel.app/api/relations/radiologist/${radiologistId}`;

  const mailOptions = {
    from: centerEmail,
    to: radiologistEmail,
    subject: `Invitation to Join Radintal from ${centerName}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f4f4f4;">
        <h2 style="color: #2c3e50;">You're Invited to Join Radintal</h2>
        <p>Dear ${radiologistName},</p>
        
        <p>We at <strong>${centerName}</strong> would like to extend an invitation for you to join <strong>Radintal</strong>, our collaborative platform designed for radiologists.</p>

        <p>By joining Radintal, you'll have the opportunity to connect with our team for image consultations, case reviews, and seamless communication, improving the quality and efficiency of your practice.</p>

        <p><strong>Contact Information for ${centerName}:</strong></p>
        <p><strong>Email:</strong> <a href="mailto:${centerEmail}" style="color: #3498db;">${centerEmail}</a></p>
        <p><strong>Phone:</strong> ${phone}</p>

        <p>If you'd like to join us, just click the button below:</p>

        <div style="text-align: center; margin: 20px 0;">
          <a href="${acceptUrl}" style="background-color: #27ae60; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Accept Invitation</a>
        </div>

        <p>We would be delighted to have you on board and look forward to collaborating with you!</p>

        <p>Best regards,</p>
        <p><strong>${centerName} Team</strong></p>
        <p style="font-size: 12px; color: #7f8c8d;">This is an automated invitation email. Please do not reply to this email address.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}


class CenterRadiologistsRelationController {
 
  async sendEmailToRadiologist(req, res) {
    try {
      const { centerId } = req.params;
      const { radiologistEmail } = req.body;

      const center = await RadiologyCenter.findById(centerId);
      if (!center) {
        return res.status(404).json({ error: "Radiology Center not found" });
      }

      const radiologist = await Radiologist.findOne({ email: radiologistEmail });

      if (!radiologist) {
        
        await sendInvitationEmail1(
          null,
          radiologistEmail,
          center.centerName,
          center.email,
          center.contactNumber
        );
      } else {
        
        await sendInvitationEmail1(
          radiologist._id.toString(),
          radiologistEmail,
          center.centerName,
          center.email,
          center.contactNumber
        );
      }

      return res.status(200).json({ message: "Invitation email sent successfully" });
    } catch (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({ error: "Failed to send email" });
    }
  }


  async addRadiologistToCenter1(req, res) {
    try {
      const { centerId } = req.params;
      const { email } = req.body;

      const center = await RadiologyCenter.findById(centerId);
      if (!center) {
        return res.status(404).json({
          error: "Not Found",
          message: "Center does not exist",
        });
      }

      const radiologist = await Radiologist.findOne({ email });
      if (!radiologist) {
        await sendInvitationEmail(email, center.centerName, center.email, center.contactNumber);
        return res.status(404).json({
          error: "Not Found",
          message: "Radiologist does not exist and an invitation email has been sent",
        });
      }

      const radiologistId = radiologist._id;
      let centerRadiologists = await CenterRadiologistsRelation.findOne({ center: centerId });

      if (!centerRadiologists) {
        centerRadiologists = new CenterRadiologistsRelation({
          center: centerId,
          radiologists: [radiologistId],
        });
      } else {
        if (centerRadiologists.radiologists.includes(radiologistId)) {
          return res.status(409).json({
            error: "Conflict",
            message: "Radiologist is already assigned to this center",
          });
        }

        centerRadiologists.radiologists.push(radiologistId);
      }

      await centerRadiologists.save();

      const updatedCenter = await CenterRadiologistsRelation.findOne({ center: centerId })
        .populate("radiologists", "-passwordHash")
        .populate("center", "name address");

      res.status(201).json({
        message: "Radiologist added successfully",
        data: updatedCenter,
      });
    } catch (error) {
      console.error("Error in addRadiologistToCenter:", error.message, error.stack);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to add radiologist to center",
        detail: error.message,
      });
    }
  }



  async getRadiologistsByCenterId(req, res) {
    try {
      const { centerId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      if (!mongoose.Types.ObjectId.isValid(centerId)) {
        return res.status(400).json({
          error: "Invalid center ID",
          message: `Center ID "${centerId}" is not valid`,
        });
      }

      const skip = (page - 1) * limit;

      const centerRadiologists = await CenterRadiologistsRelation.findOne({
        center: centerId,
      })
        .populate({
          path: "radiologists",
          select: "-passwordHash",
          options: {
            skip: skip,
            limit: parseInt(limit),
            sort: { name: 1 },
          },
        })
        .populate("center", "name address");

      if (!centerRadiologists) {
        return res.status(404).json({
          error: "Not Found",
          message: "No radiologists found for this center",
        });
      }

      const total = centerRadiologists.radiologists.length;

      res.json({
        data: {
          center: centerRadiologists.center,
          radiologists: centerRadiologists.radiologists,
          status: centerRadiologists.status,
        },
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          hasNext: skip + centerRadiologists.radiologists.length < total,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      console.error("Error in getRadiologistsByCenterId:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to retrieve radiologists",
      });
    }
  }

  async addRadiologistToCenter(req, res) {
    try {
      const { centerId } = req.params;
      const { radiologistId } = req.body;
  
      // Validate IDs
      if (!mongoose.Types.ObjectId.isValid(centerId) || !mongoose.Types.ObjectId.isValid(radiologistId)) {
        return res.status(400).json({
          error: 'Invalid ID',
          message: 'The provided center ID or radiologist ID is not valid'
        });
      }
  
      // Ensure the Radiologist exists
      const radiologistExists = await Radiologist.findById(radiologistId);
      if (!radiologistExists) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Radiologist does not exist'
        });
      }
  
      // Find the relation record
      let centerRadiologists = await CenterRadiologistsRelation.findOne({ center: centerId });
  
      // If no record exists for this center, create one
      if (!centerRadiologists) {
        centerRadiologists = new CenterRadiologistsRelation({
          center: centerId,
          radiologists: [radiologistId]
        });
      } else {
        // Check if radiologist is already assigned to this center
        if (centerRadiologists.radiologists.includes(radiologistId)) {
          return res.status(409).json({
            error: 'Conflict',
            message: 'Radiologist is already assigned to this center'
          });
        }
  
        // Add radiologist to list
        centerRadiologists.radiologists.push(radiologistId);
      }
  
      // Save the updated or new record
      await centerRadiologists.save();
  
      // Get updated data with population
      const updatedCenter = await CenterRadiologistsRelation.findOne({ center: centerId })
        .populate('radiologists', '-passwordHash')
        .populate('center', 'name address');
  
      res.status(201).json({
        message: 'Radiologist added successfully',
        data: updatedCenter
      });
  
    } catch (error) {
      console.error('Error in addRadiologistToCenter:', error.message, error.stack);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to add radiologist to center',
        detail: error.message 
      });
    }
  }
 

  async removeRadiologistFromCenter(req, res) {
    try {
      const { centerId } = req.params;
      const { radiologistId } = req.body;
  
      if (!mongoose.Types.ObjectId.isValid(centerId) || !mongoose.Types.ObjectId.isValid(radiologistId)) {
        return res.status(400).json({
          error: 'Invalid ID',
          message: 'The provided center ID or radiologist ID is not valid'
        });
      }
  
      const radiologistObjectId = new mongoose.Types.ObjectId(radiologistId);
  
      const centerRadiologists = await CenterRadiologistsRelation.findOne({ center: centerId });
  
      if (!centerRadiologists) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'No radiologists found for this center'
        });
      }
  
      const isInCenter = centerRadiologists.radiologists.some(id => id.equals(radiologistObjectId));
      if (!isInCenter) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Radiologist not found in this center'
        });
      }
  
      await centerRadiologists.removeRadiologist(radiologistObjectId);
  
      res.status(200).json({
        message: 'Radiologist removed successfully',
        data: centerRadiologists
      });
  
    } catch (error) {
      console.error('Error in removeRadiologistFromCenter:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to remove radiologist from center'
      });
    }
  }
  
  
  
  async getOnlineRadiologistsByCenterId(req, res) {
    try {
      const { centerId } = req.params;

      
      if (!mongoose.Types.ObjectId.isValid(centerId)) {
        return res.status(400).json({
          error: 'Invalid ID',
          message: 'The provided center ID is not valid'
        });
      }

      const onlineRadiologists = await CenterRadiologistsRelation.findOne({ center: centerId })
        .populate({
          path: 'radiologists',
          match: { status: 'online' },
          select: '-passwordHash'
        })
        .select('radiologists');

      if (!onlineRadiologists || !onlineRadiologists.radiologists.length) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'No online radiologists found for this center'
        });
      }

      res.status(200).json({
        message: 'Online radiologists retrieved successfully',
        data: onlineRadiologists.radiologists
      });
    } catch (error) {
      console.error('Error in getOnlineRadiologistsByCenterId:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve online radiologists'
      });
    }
  }


async getRadiologistsByCenterId1(req, res) {
  try {
    const { centerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(centerId)) {
      return res.status(400).json({
        error: "Invalid center ID",
        message: `Center ID "${centerId}" is not valid`,
      });
    }

    const skip = (page - 1) * limit;

    const centerRadiologists = await CenterRadiologistsRelation.findOne({
      center: centerId,
    })
    .populate({
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
        error: "Not Found",
        message: "No radiologists found for this center",
      });
    }

    const total = centerRadiologists.radiologists.length;

    res.json({
      data: {
        radiologists: centerRadiologists.radiologists.map(r => ({
          id: r._id,
          firstName: r.firstName,
          lastName: r.lastName,
          status: r.status,
          imageUrl: r.image,
        })),        
      },
    });
  } catch (error) {
    console.error("Error in getRadiologistsByCenterId:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to retrieve radiologists",
    });
  }
}
async getCentersByRadiologistId(req, res) {
  try {
    const { radiologistId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(radiologistId)) {
      return res.status(400).json({
        error: "Invalid radiologist ID",
        message: `Radiologist ID "${radiologistId}" is not valid`,
      });
    }

    const centers = await CenterRadiologistsRelation.findByRadiologist(radiologistId);
    if (!centers.length) {
      return res.status(404).json({
        error: "Not Found",
        message: "No centers found for this radiologist",
      });
    }

    res.json({
      data: centers.map(center => ({
        id: center.center._id,
        centerName: center.center.centerName,
        imageUrl: center.center.image, // Added imageUrl field
        address: center.center.address // Optional address
      })),
    });
  } catch (error) {
    console.error("Error in getCentersByRadiologistId:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to retrieve centers",
    });
  }
}

}

module.exports = new CenterRadiologistsRelationController();