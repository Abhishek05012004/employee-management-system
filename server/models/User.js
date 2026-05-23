const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema(
  {
    adminCode: { type: String, required: true },
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "employee", "manager", "hr"], default: "employee" },
    department: { type: String, required: true },
    position: { type: String, required: true },
    phone: String,
    address: String,
    dateOfJoining: { type: Date, default: Date.now },
    salary: Number,
    isActive: { type: Boolean, default: true },
    profileImage: String,
    workingHours: { type: Number, default: 8 }, // hours per day
    // Password reset fields
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
    // Face recognition fields
    faceEmbedding: { type: [Number], default: undefined }, // 128-d descriptor
    faceEnrolled: { type: Boolean, default: false },
    faceModelVersion: { type: String, default: "face-api-0.22.2" },
  },
  {
    timestamps: true,
  },
)

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  // Skip hashing if the password is already a bcrypt hash (from RegistrationRequest)
  if (this.password && /^\$2[ab]\$/.test(this.password)) return next()
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Indexes for better query performance
userSchema.index({ adminCode: 1 })
userSchema.index({ role: 1 })
userSchema.index({ department: 1 })
userSchema.index({ isActive: 1 })

module.exports = mongoose.model("User", userSchema)
