const mongoose = require("mongoose");
const validator = require("validator");

const radiologyCenterSchema = new mongoose.Schema(
  {
    centerName: {
      type: String,
      required: [true, "Center name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    address: {
      street: {
        type: String,
        // required: [false, "Street address is required"],
        trim: true,
      },
      city: {
        type: String,
        required: [false, "City is required"],
        trim: true,
      },
      state: {
        type: String,
        required: [true, "State is required"],
        trim: true,
      },
      zipCode: {
        type: String,
        required: [true, "ZIP code is required"],
        trim: true,
        validate: {
          validator: function (v) {
            return /^\d{5}(-\d{4})?$/.test(v);
          },
          message: "Invalid ZIP code format",
        },
      },
      // country: {
      //   type: String,
      //   // required: [true, "Country is required"],
      //   trim: true,
      // },
      // coordinates: {
      //   latitude: {
      //     type: Number,
      //     min: -90,
      //     max: 90,
      //   },
      //   longitude: {
      //     type: Number,
      //     min: -180,
      //     max: 180,
      //   },
      // },
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
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: "Please enter a valid email address",
      },
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || validator.isURL(v);
        },
        message: "Please enter a valid website URL",
      },
    },
    facilities: [
      {
        name: {
          type: String,
          // required: true,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        status: {
          type: String,
          enum: ["active", "maintenance", "inactive"],
          default: "active",
        },
      },
    ],

    // Operating hours
    operatingHours: {
      // Monday - Friday
      weekdays: {
        open: {
          type: String,
          // required: [true, "Weekday opening time is required"],
          validate: {
            validator: function (v) {
              return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: "Invalid time format (HH:MM)",
          },
        },
        close: {
          type: String,
          // required: [true, "Weekday closing time is required"],
          validate: {
            validator: function (v) {
              return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: "Invalid time format (HH:MM)",
          },
        },
      },
      // Saturday and Sunday
      weekends: {
        open: {
          type: String,
          validate: {
            validator: function (v) {
              return !v || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: "Invalid time format (HH:MM)",
          },
        },
        close: {
          type: String,
          validate: {
            validator: function (v) {
              return !v || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: "Invalid time format (HH:MM)",
          },
        },
      },
      // Public holidays and special days
      holidays: [
        {
          date: Date,
          description: String,
          isOpen: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },
    // Certifications and licenses of the radiology center
    certifications: [
      {
        name: {
          type: String,
          // required: true,
          trim: true,
        },
        issuedBy: {
          type: String,
          // required: true,
          trim: true,
        },
        issueDate: {
          type: Date,
          // required: true,
        },
        expiryDate: {
          type: Date,
          // required: true,
          validate: {
            validator: function (v) {
              return v > this.issueDate;
            },
            message: "Expiry date must be after issue date",
          },
        },
        status: {
          type: String,
          enum: ["active", "expired", "revoked"],
          default: "active",
        },
      },
    ],
    emergencyContact: {
      name: {
        type: String,
        // required: [true, "Emergency contact name is required"],
        trim: true,
      },
      number: {
        type: String,
        // required: [true, "Emergency contact number is required"],
        trim: true,
        validate: {
          validator: function (v) {
            return /^\+?[\d\s-]+$/.test(v);
          },
          message: "Please enter a valid emergency contact number",
        },
      },
      available24x7: {
        type: Boolean,
        default: true,
      },
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
    },
    path: {
      type: String,
      required: true
    },

    image: {
      type: String ,
      default: 'https://images-platform.99static.com//rx1K-opdgJV1T1yMAzjPXRPrUVs=/0x0:1000x1000/fit-in/500x500/99designs-contests-attachments/108/108268/attachment_108268211',
    },

    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
    
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
radiologyCenterSchema.index({ name: 1 });
radiologyCenterSchema.index({ "address.city": 1, "address.state": 1 });
radiologyCenterSchema.index({ status: 1 });
radiologyCenterSchema.index(
  { name: "text", "address.city": "text", "address.state": "text" },
  { name: "center_search_index" }
);

// Virtual for full address
radiologyCenterSchema.virtual("fullAddress").get(function () {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Method to check if center is currently open
radiologyCenterSchema.methods.isOpen = function () {
  if (this.status !== "active") return false;

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;

  // Check if it's a holiday
  const today = now.setHours(0, 0, 0, 0);
  const holiday = this.operatingHours.holidays.find(
    (h) => h.date.setHours(0, 0, 0, 0) === today
  );
  if (holiday) return holiday.isOpen;

  const hours = isWeekend
    ? this.operatingHours.weekends
    : this.operatingHours.weekdays;
  if (!hours.open || !hours.close) return false;

  return hours.open <= currentTime && currentTime <= hours.close;
};
// Static method to find centers by city
radiologyCenterSchema.statics.findByCity = function (city) {
  return this.find({
    "address.city": new RegExp(city, "i"),
    status: "active",
  });
};

// Pre-save middleware
radiologyCenterSchema.pre("save", function (next) {
  // Validate operating hours
  if (this.isModified("operatingHours.weekdays")) {
    const { open, close } = this.operatingHours.weekdays;
    if (open >= close) {
      throw new Error("Weekday closing time must be after opening time");
    }
  }

  if (this.isModified("operatingHours.weekends")) {
    const { open, close } = this.operatingHours.weekends;
    if (open && close && open >= close) {
      throw new Error("Weekend closing time must be after opening time");
    }
  }

  next();
});


module.exports = mongoose.model("RadiologyCenter", radiologyCenterSchema);
