const mongoose = require("mongoose");

const centerRadiologistsRelationSchema = new mongoose.Schema(
  {  
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

// Indexes
centerRadiologistsRelationSchema.index({ center: 1 }, { unique: true });
centerRadiologistsRelationSchema.index({ radiologists: 1 });
centerRadiologistsRelationSchema.index({ status: 1 });

// Method to add a radiologist
centerRadiologistsRelationSchema.methods.addRadiologist = async function (
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
centerRadiologistsRelationSchema.methods.removeRadiologist = async function (
  radiologistId
) {
  this.radiologists = this.radiologists.filter(
    (id) => !id.equals(radiologistId)
  );
  this.lastUpdated = new Date();
  return this.save();
};

// Static method to find by center with populated radiologists
centerRadiologistsRelationSchema.statics.findByCenterWithRadiologists = async function (
  centerId
) {
  return this.findOne({ center: centerId })
    .populate("radiologists", "-passwordHash")
    .populate("center", "centerName address");
};

// Static method to find centers by radiologist - UPDATED
centerRadiologistsRelationSchema.statics.findByRadiologist = async function (
  radiologistId
) {
  return this.find({
    radiologists: radiologistId,
    status: "active",
  }).populate("center", "centerName address"); // Changed from "name address" to "centerName address"
};

// Pre-save middleware
centerRadiologistsRelationSchema.pre("save", function (next) {
  this.radiologists = [...new Set(this.radiologists)];
  next();
});
// Static method to find centers by radiologist - UPDATED to include image
centerRadiologistsRelationSchema.statics.findByRadiologist = async function (
  radiologistId
) {
  return this.find({
    radiologists: radiologistId,
    status: "active",
  }).populate("center", "centerName address image"); // Added "image" to the populated fields
};

module.exports = mongoose.model("CenterRadiologistsRelation", centerRadiologistsRelationSchema);