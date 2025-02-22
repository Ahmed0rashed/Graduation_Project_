const mongoose = require("mongoose");

const centerRadiologistsSchema = new mongoose.Schema(
  {  
    // Center ID 
    center: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RadiologyCenter",
      required: [true, "Radiology Center ID is required"],
      validate: {
        validator: async function (v) {
          const center = await mongoose.model("RadiologyCenter").findById(v);
          return center !== null;
        },
        message: "Referenced Radiology Center does not exist",
      },
    },
    // Array of radiologist IDs
    radiologists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Radiologist",
        validate: {
          validator: async function (v) {
            const radiologist = await mongoose.model("Radiologist").findById(v);
            return radiologist !== null;
          },
          message: "Referenced Radiologist does not exist",
        },
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Indexes for improved query performance
centerRadiologistsSchema.index({ center: 1 }, { unique: true });
centerRadiologistsSchema.index({ radiologists: 1 });
centerRadiologistsSchema.index({ status: 1 });

// Method to add a radiologist
centerRadiologistsSchema.methods.addRadiologist = async function (
  radiologistId
) {
  if (!this.radiologists.includes(radiologistId)) {
    this.radiologists.push(radiologistId);
    this.lastUpdated = new Date();
    return this.save();
  }
  return this;
};

// Method to remove a radiologist
centerRadiologistsSchema.methods.removeRadiologist = async function (
  radiologistId
) {
  this.radiologists = this.radiologists.filter(
    (id) => !id.equals(radiologistId)
  );
  this.lastUpdated = new Date();
  return this.save();
};

// Static method to find by center with populated radiologists
centerRadiologistsSchema.statics.findByCenterWithRadiologists = async function (
  centerId
) {
  return this.findOne({ center: centerId })
    .populate("radiologists", "-passwordHash")
    .populate("center", "name address");
};

// Static method to find centers by radiologist
centerRadiologistsSchema.statics.findByRadiologist = async function (
  radiologistId
) {
  return this.find({
    radiologists: radiologistId,
    status: "active",
  }).populate("center", "name address");
};

// Pre-save middleware
centerRadiologistsSchema.pre("save", function (next) {
  // Remove duplicates from radiologists array
  this.radiologists = [...new Set(this.radiologists)];
  next();
});
module.exports = mongoose.model("CenterRadiologists", centerRadiologistsSchema);
