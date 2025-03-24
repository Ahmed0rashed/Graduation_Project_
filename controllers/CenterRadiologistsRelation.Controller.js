const CenterRadiologistsRelation = require("../models/CenterRadiologistsRelation.Model");
const mongoose = require("mongoose");

class CenterRadiologistsRelationController {
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

        await centerRadiologists.addRadiologist(radiologistId);
      }

      await centerRadiologists.save();

      const updatedCenter = await CenterRadiologistsRelation.findOne({ center: centerId })
        .populate('radiologists', '-passwordHash')
        .populate('center', 'name address');

      res.status(201).json({
        message: 'Radiologist added successfully',
        data: updatedCenter
      });
    } catch (error) {
      console.error('Error in addRadiologistToCenter:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to add radiologist to center'
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