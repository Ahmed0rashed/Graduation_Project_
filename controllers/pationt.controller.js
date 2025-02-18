const User = require("../models/Patients.model");
const bcrypt = require("bcrypt");
const validator = require("validator");
const Patient = require("../models/Patients.model");

//  Create a new patient record with the given details
exports.addPatient = async (req, res) => {
  try {
    const {
      nationalId,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email,
      password,
      contactNumber,
      address,
      medicalHistory,
      emergencyContact,
    } = req.body;

    // Validation
    const validationErrors = [];

    // Required field validations
    if (!nationalId || !/^[A-Z0-9]{10,14}$/.test(nationalId)) {
      validationErrors.push(
        "A valid national ID (10-14 alphanumeric characters) is required"
      );
    }

    if (!firstName || firstName.length < 2 || firstName.length > 50) {
      validationErrors.push("First name must be between 2 and 50 characters");
    }

    if (!lastName || lastName.length < 2 || lastName.length > 50) {
      validationErrors.push("Last name must be between 2 and 50 characters");
    }

    if (!email || !validator.isEmail(email)) {
      validationErrors.push("A valid email is required");
    }

    if (!dateOfBirth || isNaN(Date.parse(dateOfBirth))) {
      validationErrors.push("A valid date of birth is required");
    }

    if (!gender || !["Male", "Female", "Other"].includes(gender)) {
      validationErrors.push("Gender must be Male, Female, or Other");
    }

    if (!password || password.length < 8) {
      validationErrors.push("Password must be at least 8 characters long");
    }

    if (!contactNumber || !/^\+?[\d\s-]+$/.test(contactNumber)) {
      validationErrors.push("A valid contact number is required");
    }

    // Optional field validations
    if (address) {
      const { street, city, state, zipCode, country } = address;
      if (typeof address !== "object") {
        validationErrors.push("Address must be an object with valid fields");
      }
    }
    // Validate medical history fields 
    if (medicalHistory) {
      if (medicalHistory.conditions) {
        if (!Array.isArray(medicalHistory.conditions)) {
          validationErrors.push("Medical conditions must be an array");
        } else {
          for (const condition of medicalHistory.conditions) {
            if (!condition.name || !condition.diagnosedDate) {
              validationErrors.push(
                "Each medical condition must have a name and diagnosed date"
              );
            }
          }
        }
      }
      // Validate allergies and medications fields
      if (medicalHistory.allergies) {
        if (!Array.isArray(medicalHistory.allergies)) {
          validationErrors.push("Allergies must be an array");
        } else {
          for (const allergy of medicalHistory.allergies) {
            if (
              !allergy.type ||
              !["Mild", "Moderate", "Severe"].includes(allergy.severity)
            ) {
              validationErrors.push(
                "Each allergy must have a type and valid severity (Mild, Moderate, Severe)"
              );
            }
          }
        }
      }
      // Validate medications field
      if (medicalHistory.medications) {
        if (!Array.isArray(medicalHistory.medications)) {
          validationErrors.push("Medications must be an array");
        } else {
          for (const medication of medicalHistory.medications) {
            if (
              !medication.name ||
              !medication.dosage ||
              !medication.frequency
            ) {
              validationErrors.push(
                "Each medication must have a name, dosage, and frequency"
              );
            }
          }
        }
      }
    }
    // Validate emergency contact fields
    if (emergencyContact) {
      if (!emergencyContact.name || !emergencyContact.relationship) {
        validationErrors.push(
          "Emergency contact must have a name and relationship"
        );
      }
      if (
        emergencyContact.contactNumber &&
        !/^\+?[\d\s-]+$/.test(emergencyContact.contactNumber)
      ) {
        validationErrors.push("Emergency contact number must be valid");
      }
    }
    // Return validation errors if any are found
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation Error",
        details: validationErrors,
      });
    }

    // Check for existing email and national ID
    const [existingEmail, existingNationalId] = await Promise.all([
      Patient.findOne({ email }),
      Patient.findOne({ nationalId }),
    ]);
    // Return conflict error if email or national ID is already registered
    if (existingEmail) {
      return res.status(409).json({
        error: "Conflict",
        message: `Email "${email}" is already registered`,
      });
    }
    if (existingNationalId) {
      return res.status(409).json({
        error: "Conflict",
        message: `National ID "${nationalId}" is already registered`,
      });
    }

    // Create new patient record
    const hashedPassword = await bcrypt.hash(password, 10);
    const newPatient = new Patient({
      nationalId,
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      email,
      passwordHash: hashedPassword,
      contactNumber,
      address: address || {},
      medicalHistory: {
        conditions: medicalHistory?.conditions || [],
        allergies: medicalHistory?.allergies || [],
        medications: medicalHistory?.medications || [],
      },
      emergencyContact: emergencyContact || {},
      registrationDate: new Date(),
      status: "Active",
    });

    await newPatient.save();

    // Remove sensitive data before sending response
    const patientResponse = newPatient.toObject();
    delete patientResponse.passwordHash;

    res.status(201).json({
      message: "Patient registered successfully",
      data: patientResponse,
    });
  } catch (error) {
    console.error("Error in addPatient:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Error registering patient",
    });
  }
};
// Get all patients from the database and send them to the server 
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await User.find();
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: "Error fetching patients", error });
    console.log(`this error is ${error}`);
  }
};

/**
 * Get patient statistics
 * This API function is designed to fetch patient statistics from a MongoDB collection using Mongoose and return them as a JSON response.
 * @route GET /api/patients/statistics
 */
exports.getPatientStatistics = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    // Fetch all required statistics in parallel using Promise.all
    const [
      totalPatients,
      newPatientsThisMonth,
      newPatientsThisYear,
      genderDistribution,
      ageDistribution,
    ] = await Promise.all([
      Patient.countDocuments(),
      Patient.countDocuments({ registrationDate: { $gte: startOfMonth } }),
      Patient.countDocuments({ registrationDate: { $gte: startOfYear } }),
      // Fetch gender distribution statistics
      Patient.aggregate([
        {
          $group: {
            _id: "$gender",
            count: { $sum: 1 },
          },
        },
      ]),
      // Fetch age distribution statistics
      Patient.aggregate([
        {
          $addFields: {
            age: {
              $floor: {
                $divide: [
                  { $subtract: [today, "$dateOfBirth"] },
                  365.25 * 24 * 60 * 60 * 1000,
                ],
              },
            },
          },
        },
        {
          $bucket: {
            groupBy: "$age",
            boundaries: [0, 18, 30, 45, 60, 75, 100],
            default: "100+",
            output: {
              count: { $sum: 1 },
            },
          },
        },
      ]),
    ]);
    const genderStats = Object.fromEntries(
      genderDistribution.map(({ _id, count }) => [_id, count])
    );
    // Return the statistics as a JSON response
    res.status(200).json({
      data: {
        totalPatients,
        newPatients: {
          thisMonth: newPatientsThisMonth,
          thisYear: newPatientsThisYear,
        },
        genderDistribution: genderStats,
        ageDistribution: ageDistribution.map(({ _id, count }) => ({
          range: _id === "100+" ? _id : `${_id}-${_id + 14}`,
          count,
        })),
      },
    });
    // Handle potential errors in fetching statistics
  } catch (error) {
    console.error("Error in getPatientStatistics:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Error fetching patient statistics",
    });
  }
};

module.exports = exports;
