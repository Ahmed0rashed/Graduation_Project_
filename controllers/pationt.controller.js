const User = require("../models/Patients.model");
const bcrypt = require("bcrypt");
const validator = require("validator");
const Patient = require("../models/Patients.model");

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


    const validationErrors = [];


    if (!nationalId || !/^[A-Z0-9]{10,14}$/.test(nationalId)) {
      validationErrors.push(
        "A valid national ID (10-14 alphanumeric characters) is required"
      );
    }

    if (!firstName || firstName.length < 2 || firstName.length > 50) {
      validationErrors.push("First name must be between 2 and 50 characters");
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


    if (address) {
      const { street, city, state, zipCode, country } = address;
      if (typeof address !== "object") {
        validationErrors.push("Address must be an object with valid fields");
      }
    }

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

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation Error",
        details: validationErrors,
      });
    }


    const [existingEmail, existingNationalId] = await Promise.all([
      Patient.findOne({ email }),
      Patient.findOne({ nationalId }),
    ]);

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

exports.getAllPatients = async (req, res) => {
  try {
    const patients = await User.find();
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: "Error fetching patients", error });
    console.log(`this error is ${error}`);
  }
};


exports.getPatientStatistics = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

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

      Patient.aggregate([
        {
          $group: {
            _id: "$gender",
            count: { $sum: 1 },
          },
        },
      ]),

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

  } catch (error) {
    console.error("Error in getPatientStatistics:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Error fetching patient statistics",
    });
  }
};
// get patient by nationalId
exports.getPatientByNationalId = async (req, res) => {
  try {
    const { nationalId } = req.params;
    const patient = await Patient.findOne({ nationalId }).select("-passwordHash");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.status(200).json(patient);
  } catch (error) {
    console.error("Error in getPatientByNationalId:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Error fetching patient by national ID",
    });
  }
};
// add record to patient
exports.addRecordToPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { recordId } = req.body;
    if (!recordId) {
      return res.status(400).json({ message: "recordId is required in body" });
    }
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
   const x = patient.records.push(recordId);

if (x === 0) {
  return res.status(500).json({ message: "Failed to add record to patient" });
} 
console.log("patientId from params:", patientId);
console.log("recordId from body:", recordId);


    await patient.save();
    res.status(200).json({ message: "Record added to patient", patient });
  } catch (error) {
    console.error("Error in addRecordToPatient:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Error adding record to patient",
    });
  }
};
// get all records of a patient
 exports.getPatientRecords = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findById(patientId).populate('records');
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.status(200).json({ records: patient.records });
  }
  catch (error) {
    console.error("Error in getPatientRecords:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Error fetching patient records",
    });
  }
  };

module.exports = exports;
