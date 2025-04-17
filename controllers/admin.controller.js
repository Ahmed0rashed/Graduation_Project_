const Admin = require("../models/admin.model");
const Radiologist = require("../models/Radiologists.Model");
const Notification = require("../models/not.model");
const RadiologyCenter = require("../models/Radiology_Centers.Model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");



exports.addRadiologist = async (req, res) => {
  try {
    const { firstName , lastName,specialization, email, password, contactNumber } = req.body;

    const existingRadiologist = await Radiologist.findOne({ email });


    if (existingRadiologist) {
      return res
        .status(409)
        .json({ message: "Radiologist with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newRadiologist = new Radiologist({
    firstName,
    lastName,
    specialization,
    contactNumber,
    email,
    passwordHash : hashedPassword,
    
   
    });

    const savedRadiologist = await newRadiologist.save();

    res.status(201).json({
      message: "Radiologist added successfully",
      data: savedRadiologist,
    });
  } catch (error) {
    console.error("Error in adding radiologist:", error);
    res.status(500).json({ message: "Failed to add radiologist" , error });
  }
};
exports.getRadiologists = async (req, res) => {
    try {
      const radiologists = await Radiologist.find({}).select("-password");
  
      res.status(200).json({
        message: "Radiologists fetched successfully",
        data: radiologists,
      });
    } catch (error) {
      console.error("Error in fetching radiologists:", error);
      res.status(500).json({ message: "Failed to fetch radiologists" });
    }
  };
  

exports.removeRadiologist = async (req, res) => {
  try {
    const { id } = req.params;

    const radiologist = await Radiologist.findByIdAndDelete(id);

    if (!radiologist) {
      return res.status(404).json({ message: "Radiologist not found" });
    }

    res.status(200).json({ message: "Radiologist deleted successfully" });
  } catch (error) {
    console.error("Error in removing radiologist:", error);
    res.status(500).json({ message: "Failed to remove radiologist" });
  }
};
exports.updateRadiologist = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phoneNumber, address } = req.body;

    const updatedRadiologist = await Radiologist.findByIdAndUpdate(
      id,
      { firstName, lastName, email, phoneNumber, address },
      { new: true }
    );

    if (!updatedRadiologist) {
      return res.status(404).json({ message: "Radiologist not found" });
    }

    res.status(200).json({
      message: "Radiologist updated successfully",
      data: updatedRadiologist,
    });
  } catch (error) {
    console.error("Error in updating radiologist:", error);
    res.status(500).json({ message: "Failed to update radiologist" });
  }
};
exports.getRadiologistbyId = async (req, res) => {
  try {
    const { id } = req.params;
    const radiologist = await Radiologist.findById(id).select("-password");

    if (!radiologist) {
      return res.status(404).json({ message: "Radiologist not found" });
    }

    res.status(200).json({
      message: "Radiologist fetched successfully",
      data: radiologist,
    });
  } catch (error) {
    console.error("Error in fetching radiologist by ID:", error);
    res.status(500).json({ message: "Failed to fetch radiologist" });
  }
};

exports.addRadiologyCenter = async (req, res) => {
  try {
    const { centerName, email, contactNumber, password ,street,city,state,zipCode, image} = req.body;

    const existingCenter = await RadiologyCenter.findOne({ email });

    if (existingCenter) {
      return res
        .status(409)
        .json({ message: "Radiology center with this email already exists" });
    }

    const path = image? image : " ";
    const hashedPassword = await bcrypt.hash(password, 12);
  
    const parsedAddress = {
        street,
        city,
        state,
        zipCode,  
      };

    const newRadiologyCenter = new RadiologyCenter({
      centerName,
      address : parsedAddress,
      contactNumber,
      email: email,
      passwordHash: hashedPassword,
      path : path,
      isApproved: true,
    });

    const savedCenter = await newRadiologyCenter.save();

    res.status(201).json({
      message: "Radiology center added successfully",
      data: savedCenter,
    });
  } catch (error) {
    console.error("Error in adding radiology center:", error);
    res.status(500).json({ message: "Failed to add radiology center" , error });
  }
};


exports.removeRadiologyCenter = async (req, res) => {
  try {
    const { centerId } = req.params;
    
    const deletedCenter = await RadiologyCenter.findByIdAndDelete(centerId);
    
    if (!deletedCenter) {
      return res.status(404).json({ message: "Radiology center not found" });
    }
    
    res.status(200).json({ message: "Radiology center removed successfully" });
  } catch (error) {
    console.error("Error in removing radiology center:", error);
    res.status(500).json({ message: "Failed to remove radiology center" });
  }
};


exports.getApprovedRadiologyCenters = async (req, res) => {
  try {
    const approvedCenters = await RadiologyCenter.find({ isApproved: true });

    if (!approvedCenters) {
      return res.status(404).json({ message: "No approved radiology centers found" });
    }

    res.status(200).json({ message: "Approved radiology centers", data: approvedCenters });
  } catch (error) {
    console.error("Error in getting approved radiology centers:", error);
    res.status(500).json({ message: "Failed to get approved radiology centers" });
  }
};

exports.getNotApprovedRadiologyCenters = async (req, res) => {
  try {
    const approvedCenters = await RadiologyCenter.find({ isApproved: false });

    if (!approvedCenters) {
      return res.status(404).json({ message: "No approved radiology centers found" });
    }

    res.status(200).json({ message: "Approved radiology centers", data: approvedCenters });
  } catch (error) {
    console.error("Error in getting approved radiology centers:", error);
    res.status(500).json({ message: "Failed to get approved radiology centers" });
  }
};
// change isApproved to true
exports.approveRadiologyCenter = async (req, res) => {
  try {
    const { centerId } = req.params;

    const updatedCenter = await RadiologyCenter.findByIdAndUpdate(
      centerId,
      { isApproved: true },
      { new: true }
    );

    if (!updatedCenter) {
      return res.status(404).json({ message: "Radiology center not found" });
    }

    res.status(200).json({
      message: "Radiology center approved successfully",
      data: updatedCenter,
    });
  } catch (error) {
    console.error("Error in approving radiology center:", error);
    res.status(500).json({ message: "Failed to approve radiology center" });
  }
};


exports.updateRadiologyCenter = async (req, res) => {
  try {
    const { centerId } = req.params;
    const { centerName, address, email, contactNumber } = req.body;

    const updatedCenter = await RadiologyCenter.findByIdAndUpdate(
      centerId,
      { centerName, address, email, contactNumber },
      { new: true }
    );

    if (!updatedCenter) {
      return res.status(404).json({ message: "Radiology center not found" });
    }

    res.status(200).json({
      message: "Radiology center updated successfully",
      data: updatedCenter,
    });
  } catch (error) {
    console.error("Error in updating radiology center:", error);
    res.status(500).json({ message: "Failed to update radiology center" });
  }
};

exports.getRadiologyCenterById = async (req, res) => {
  try {
    const { centerId } = req.params;
    const center = await RadiologyCenter.findById(centerId).select("-passwordHash");

    if (!center) {
      return res.status(404).json({ message: "Radiology center not found" });
    }
    res.status(200).json({
      message: "Radiology center fetched successfully",
      data: center,
    });
  } catch (error) {
    console.error("Error in fetching radiology center by ID:", error);
    res.status(500).json({ message: "Failed to fetch radiology center" });
  }
};


  exports.addAdmin = async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email.endsWith("@admin.com")) {
        return res.status(400).json({
          message: "Admin email must end with '@admin.com'",
        });
      }

      const existingAdmin = await Admin.findOne({ email });

      if (existingAdmin) {
        return res
          .status(409)
          .json({ message: "Admin with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const newAdmin = new Admin({
        email,
        passwordHash: hashedPassword,
      });

      const savedAdmin = await newAdmin.save();

      res.status(201).json({
        message: "Admin added successfully",
        data: savedAdmin,
      });
    } catch (error) {
      console.error("Error in adding admin:", error);
      res.status(500).json({ message: "Failed to add admin" ,error});
    }
  };

  exports.getAllRadiologyCenters = async (req, res) => {
    try {
      const centers = await RadiologyCenter.find().select("-passwordHash");

      if (!centers) {
        return res.status(404).json({ message: "No radiology centers found" });
      }

      res.status(200).json({
        message: "Radiology centers fetched successfully",
        data: centers,
      });
    } catch (error) {
      console.error("Error in fetching radiology centers:", error);
      res.status(500).json({ message: "Failed to fetch radiology centers" });
    }
  };
