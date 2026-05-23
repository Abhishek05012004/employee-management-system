const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const registrationRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    department: { type: String, required: true },
    position: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    role: { type: String, enum: ["admin", "employee", "manager", "hr"], default: "employee" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminCode: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectionReason: String,
    faceEmbedding: { type: [Number], default: undefined },
    faceModelVersion: { type: String, default: "face-api-0.22.2" },
  },
  {
    timestamps: true,
  },
)

// Hash password before saving
registrationRequestSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Indexes for better query performance
registrationRequestSchema.index({ adminCode: 1 })
registrationRequestSchema.index({ status: 1 })

module.exports = mongoose.model("RegistrationRequest", registrationRequestSchema)
