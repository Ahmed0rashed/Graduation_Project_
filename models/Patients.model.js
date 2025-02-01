const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
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
    required: [true, 'Email is required'],
    unique: true, 
    trim: true,
    lowercase: true,
  },
  passwordHash: {
    type: String,
    required: [true, "Password hash is required"],
  },
}, { timestamps: true });


patientSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

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


patientSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};


patientSchema.pre("save", function (next) {

  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

module.exports = mongoose.model("Patient", patientSchema);
