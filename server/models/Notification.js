const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema(
  {
    adminCode: { type: String, required: true },
    type: {
      type: String,
      enum: ["leave_request", "registration_request"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String, // Frontend route to navigate to
      required: true,
    },
    recipientRoles: [
      {
        // Roles that should see this notification
        type: String,
        enum: ["admin", "manager", "hr", "employee"],
        required: true,
      },
    ],
    recipientUser: {
      // For specific user notifications (e.g. employee's leave approved)
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    readBy: [
      {
        // Array of user IDs who have read this notification
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    relatedId: {
      // ID of the actual leave/registration request
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "relatedModel", // Dynamic reference
    },
    relatedModel: {
      // To store which model relatedId refers to
      type: String,
      required: true,
      enum: ["Leave", "RegistrationRequest"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActioned: {
      type: Boolean,
      default: false,
    },
    actionTaken: {
      type: String,
    },
    actionBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

notificationSchema.index({ recipientRoles: 1, createdAt: -1 })
notificationSchema.index({ relatedId: 1 })
notificationSchema.index({ adminCode: 1 })
notificationSchema.index({ recipientUser: 1 })

module.exports = mongoose.model("Notification", notificationSchema)
