const User = require("../models/Patients.model");
const bcrypt = require("bcrypt");
const validator = require("validator");
const Patient = require("../models/Patients.model");

exports.addPatient = async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, gender, email, password } =
      req.body;

    if (!email || !validator.isEmail(email)) {
      return res.send("A valid Email is Required");
    }
    if (!firstName || !lastName) {
      return res.send("First name and last name are required");
    }
    if (!dateOfBirth) {
      return res.send("Date of birth is required");
    }
    if (!gender || !["Male", "Female"].includes(gender)) {
      return res.send("A valid gender is required");
    }
    if (!password) {
      return res.send("A valid Password is required");
    }
    if (await User.findOne({ email })) {
      return res.status(400).send(`This email "${email}" already exists`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newPatient = new User({
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email,
      passwordHash: hashedPassword,
    });

    await newPatient.save();
    res.status(201).json(newPatient); 
  } catch (error) {
    res.status(500).json({ message: "Error registering patient", error });
    console.log(`this error is ${error}`);
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
      ageDistribution
    ] = await Promise.all([
      Patient.countDocuments(),
      Patient.countDocuments({ registrationDate: { $gte: startOfMonth } }),
      Patient.countDocuments({ registrationDate: { $gte: startOfYear } }),
      // Fetch gender distribution statistics
      Patient.aggregate([
        {
          $group: {
            _id: "$gender",
            count: { $sum: 1 }
          }
        }
      ]),
      // Fetch age distribution statistics
      Patient.aggregate([
        {
          $addFields: {
            age: {
              $floor: {
                $divide: [
                  { $subtract: [today, "$dateOfBirth"] },
                  365.25 * 24 * 60 * 60 * 1000
                ]
              }
            }
          }
        },
        {
          $bucket: {
            groupBy: "$age",
            boundaries: [0, 18, 30, 45, 60, 75, 100],
            default: "100+",
            output: {
              count: { $sum: 1 }
            }
          }
        }
      ])
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
          thisYear: newPatientsThisYear
        },
        genderDistribution: genderStats,
        ageDistribution: ageDistribution.map(({ _id, count }) => ({
          range: _id === "100+" ? _id : `${_id}-${_id + 14}`,
          count
        }))
      }
    });
    // Handle potential errors in fetching statistics
  } catch (error) {
    console.error("Error in getPatientStatistics:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Error fetching patient statistics"
    });
  }
}

module.exports = exports;
