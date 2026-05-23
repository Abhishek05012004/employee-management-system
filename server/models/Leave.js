const mongoose = require("mongoose")

const leaveSchema = new mongoose.Schema(
  {
    adminCode: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    leaveType: {
      type: String,
      enum: ["sick", "casual", "annual", "maternity", "emergency"],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date,
    comments: String,
  },
  {
    timestamps: true,
  },
)

// Indexes for better query performance
leaveSchema.index({ user: 1 })
leaveSchema.index({ adminCode: 1 })
leaveSchema.index({ status: 1 })
leaveSchema.index({ startDate: 1, endDate: 1 })

module.exports = mongoose.model("Leave", leaveSchema)
