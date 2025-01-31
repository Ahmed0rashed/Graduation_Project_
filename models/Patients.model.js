const mongoose = require("mongoose");
const { isLowercase } = require("validator");

const patientSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
      validate: {
        validator: function (value) {
          return value <= new Date();
        },
        message: "Date of birth cannot be in the future",
      },
    },
    gender: {
      type: String,
      enum: {
        values: ["Male", "Female"],
        message: "{VALUE} is not a valid gender",
      },
      required: [true, "Gender is required"],
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^\+?[\d\s-]+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number`,
      },
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      Lowercase: true,
      validate: {
        validator: function (v) {
          return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email address`,
      },
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual for full name
patientSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

//Virtual for age calculation based on dateOfBirth field
patientSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
});

// Indexes for patient collection
patientSchema.index({ email: 1 }, { unique: true, sparse: true });
patientSchema.index({ firstName: 1, lastName: 1 });
patientSchema.index({ dateOfBirth: 1 });

// Method to remove password hash from JSON response
patientSchema.methods.toPublicJSON = function () {
  const patient = this.toObject();
  delete patient.passwordHash;
  return patient;
};

// Statics method to find patient by email
patientSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Pre-save middleware to ensure email is lowercase
patientSchema.pre("save", function (next) {
  // Ensure email is lowercase before saving
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

module.exports = mongoose.model("Patient", patientSchema);
