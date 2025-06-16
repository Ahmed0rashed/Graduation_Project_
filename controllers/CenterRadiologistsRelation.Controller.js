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

  const acceptUrl = radiologistId
    ? `https://graduation-project-mmih.vercel.app/api/relations/radiologist/${radiologistId}`
    : `https://graduation-project-mmih.vercel.app/signup`;

  const mailOptions = {
    from: centerEmail,
    to: radiologistEmail,
    subject: `✨ Exclusive Invitation to Join Radintal – From ${centerName}`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; background: linear-gradient(145deg, #f0f4f8, #ffffff); padding: 40px 0;">
        <table align="center" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 650px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 30px rgba(0,0,0,0.1);">
          <tr>
            <td>
              <img src="https://cdn.dribbble.com/userupload/15606497/file/original-1d7be0867731a998337730f39268a54a.png?format=webp&resize=600x220&vertical=center" alt="Radintal Invitation Banner" style="width: 100%; display: block;">
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="color: #2c3e50; font-size: 28px; margin-bottom: 15px;">You're Invited to Radintal 🎉</h1>
              <p style="font-size: 16px; color: #555;">Hi <strong>${radiologistName}</strong>,</p>

              <p style="font-size: 16px; color: #555; line-height: 1.6;">
                <strong>${centerName}</strong> is excited to welcome you to <strong>Radintal</strong> — our innovative platform built for radiologists to connect, collaborate, and deliver smarter, faster diagnostics.
              </p>

              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <p style="margin: 0; font-size: 15px;"><strong>📧 Center Email:</strong> <a href="mailto:${centerEmail}" style="color: #007BFF;">${centerEmail}</a></p>
                <p style="margin: 5px 0 0;"><strong>📞 Phone:</strong>${phone}</p>
              </div>

              <div style="text-align: center; margin: 35px 0;">
                <a href="${acceptUrl}" style="background: linear-gradient(to right, #1abc9c, #16a085); color: #fff; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(13, 255, 0, 0.57);">Accept Invitation</a>
              </div>

              <p style="font-size: 15px; color: #888; line-height: 1.5;">If you're ready to elevate your radiology workflow, this is your chance. Click above to join us!</p>
              <p style="margin-top: 40px; font-size: 14px; color: #999;">With appreciation,<br><strong>${centerName} Team</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background: #f1f1f1; text-align: center; padding: 20px; font-size: 12px; color: #999;">
              This is an automated email from Radintal. Please do not reply directly to this message.
            </td>
          </tr>
        </table>
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