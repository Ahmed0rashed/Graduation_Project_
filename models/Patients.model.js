const mongoose = require("mongoose");
const validator = require("validator");

const patientSchema = new mongoose.Schema(
  {
    nationalId: {
      type: String,
      required: false,
      unique: true,
      sparse: true, 
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,  
      trim: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: "Please enter a valid email address",
      },
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters long"],
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [false, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters long"],
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    // dateOfBirth: {
    //   type: Date,
    //   required: [true, "Date of birth is required"],
    //   validate: {
    //     validator: function (v) {
    //       return v && v.getTime() <= new Date().getTime();
    //     },
    //     message: "Date of birth cannot be in the future",
    //   },
    // },
    // gender: {
    //   type: String,
    //   required: [true, "Gender is required"],
    //   enum: ["Male", "Female", "Other"],
    // },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
    },
    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
      validate: {
        validator: function (v) {
          return /^\+?[\d\s-]+$/.test(v);
        },
        message: "Please enter a valid contact number",
      },
    },
    // list of recoreds id
    records: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RadiologyRecord",
      },
    ],
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    medicalHistory: {
      conditions: [
        {
          name: String,
          diagnosedDate: Date,
          notes: String,
        },
      ],
      allergies: [
        {
          name: String,
          severity: { type: String, enum: ["Mild", "Moderate", "Severe"] },
        },
      ],
      medications: [
        {
          name: String,
          dosage: String,
          frequency: String,
          startDate: Date,
          endDate: Date,
        },
      ],
    },
    registrationDate: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    lastVisit: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Blocked"],
      default: "Active",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);


// Remove duplicate indexes
// patientSchema.index({ nationalId: 1 }, { unique: true }); // Remove
// patientSchema.index({ email: 1 }, { unique: true }); // Remove

// Other indexes for search and performance
patientSchema.index({ firstName: 1, lastName: 1 });
patientSchema.index({ dateOfBirth: 1 });
patientSchema.index({ registrationDate: 1 });
patientSchema.index({ status: 1 });
patientSchema.index(
  { firstName: "text", lastName: "text", email: "text", nationalId: "text" },
  { name: "patient_search_index" }
);

// Virtual for full name
patientSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
patientSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Instance method to update last visit
patientSchema.methods.updateLastVisit = async function () {
  this.lastVisit = new Date();
  return this.save();
};

// Static method to find patients by age range
patientSchema.statics.findByAgeRange = function (minAge, maxAge) {
  const today = new Date();
  const minDate = new Date(today.getFullYear() - maxAge - 1, today.getMonth(), today.getDate());
  const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());

  return this.find({
    dateOfBirth: { $gte: minDate, $lte: maxDate },
  });
};

// Pre-save middleware
patientSchema.pre("save", function (next) {
  if (this.isNew) {
    this.registrationDate = new Date();
  }
  next();
});

module.exports = mongoose.model("Patient", patientSchema);
