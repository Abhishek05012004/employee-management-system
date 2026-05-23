// Make sure to install nodemailer: npm install nodemailer
const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const helmet = require("helmet")
const mongoSanitize = require("express-mongo-sanitize")
const hpp = require("hpp")
const rateLimit = require("express-rate-limit")
require("dotenv").config()
// Import routes
const authRoutes = require("./routes/auth")
const attendanceRoutes = require("./routes/attendance")
const userRoutes = require("./routes/users")
const leaveRoutes = require("./routes/leave")
const faceRoutes = require("./routes/face")

const app = express()

/* ================================
   CORS CONFIGURATION - FIXED
   ================================ */
const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()) : []),
  "http://localhost:5173", // Local development
  "http://localhost:3000", // Alternative local development port
].filter(Boolean)

console.log("Allowed CORS origins:", allowedOrigins)

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like Postman or server-to-server requests)
      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      console.log("❌ CORS blocked for origin:", origin)
      return callback(new Error("Not allowed by CORS"))
    },
    credentials: true,
  }),
)

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

/* ================================
   SECURITY MIDDLEWARE
   ================================ */
// Set security HTTP headers
app.use(helmet())

// Prevent NoSQL injections
app.use(mongoSanitize())

// Prevent HTTP param pollution
app.use(hpp())

// Rate limiting: 100 requests per 10 mins per IP
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs. Increased to 1000 to avoid breaking legitimate usage since it's an internal tool.
  message: "Too many requests from this IP, please try again after 10 minutes"
})
app.use("/api", limiter)

/* ================================
   MONGODB CONNECTION
   ================================ */
let isConnected = false // Track connection status

const connectDB = async () => {
  if (isConnected) {
    console.log("✅ Using existing MongoDB connection")
    return
  }

  try {
    console.log("Connecting to MongoDB...")
    console.log("MongoDB URI:", process.env.MONGO_URI ? "Set" : "Not set")
    console.log("JWT Secret:", process.env.JWT_SECRET ? "Set" : "Not set")

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    })

    isConnected = true
    console.log("✅ MongoDB connected successfully")
    console.log("Database name:", mongoose.connection.name)

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err)
      isConnected = false
    })

    mongoose.connection.on("disconnected", () => {
      console.log("ℹ️ MongoDB disconnected")
      isConnected = false
    })

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected")
      isConnected = true
    })
  } catch (err) {
    console.error("❌ MongoDB connection error:", err)
    isConnected = false
    // Don't exit process in serverless environment
    if (process.env.NODE_ENV !== "production") {
      process.exit(1)
    }
  }
}

// Connect to MongoDB when the server starts
connectDB()

/* ================================
   MIDDLEWARE TO CHECK DB CONNECTION
   ================================ */
app.use(async (req, res, next) => {
  if (!isConnected) {
    try {
      await connectDB()
    } catch (error) {
      return res.status(503).json({
        error: "Database temporarily unavailable",
        message: "Please try again in a moment",
      })
    }
  }
  next()
})

/* ================================
   ROUTES
   ================================ */
app.use("/api/auth", authRoutes)
app.use("/api/attendance", attendanceRoutes)
app.use("/api/users", userRoutes)
app.use("/api/leave", leaveRoutes)
app.use("/api/face", faceRoutes)

/* ================================
   HEALTH CHECK
   ================================ */
app.get("/api/health", async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState
    let dbStatus = "Disconnected"

    if (dbState === 1) dbStatus = "Connected"
    else if (dbState === 2) dbStatus = "Connecting"
    else if (dbState === 3) dbStatus = "Disconnecting"

    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      databaseState: dbState,
      environment: {
        nodeEnv: process.env.NODE_ENV || "development",
        mongoUri: !!process.env.MONGO_URI,
        jwtSecret: !!process.env.JWT_SECRET,
        vercel: !!process.env.VERCEL,
      },
    })
  } catch (error) {
    res.status(500).json({
      status: "Error",
      error: error.message,
    })
  }
})

/* ================================
   ROOT ENDPOINT
   ================================ */
app.get("/", (req, res) => {
  res.json({
    message: "Attendance System API Server",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      attendance: "/api/attendance",
      users: "/api/users",
      leave: "/api/leave",
      face: "/api/face",
    },
  })
})

/* ================================
   AUTH LOGIN INFO ROUTE
   ================================ */
app.get("/api/auth/login", (req, res) => {
  res.json({
    message: "Login endpoint - use POST method with email and password",
    method: "POST",
    endpoint: "/api/auth/login",
    body: {
      email: "your-email@example.com",
      password: "your-password",
    },
  })
})

/* ================================
   404 HANDLER
   ================================ */
app.use("*", (req, res) => {
  console.log("404 - Route not found:", req.originalUrl)
  res.status(404).json({
    error: "Route not found",
    requestedUrl: req.originalUrl,
    availableEndpoints: ["/api/health", "/api/auth", "/api/attendance", "/api/users", "/api/leave", "/api/face"],
  })
})

/* ================================
   GLOBAL ERROR HANDLER
   ================================ */
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.stack)
  res.status(500).json({ error: "Something went wrong!" })
})

/* ================================
   LOCAL SERVER START
   ================================ */
if (require.main === module) {
  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => {
    console.log(`Server running locally on port ${PORT}`)
  })
}

/* ================================
   EXPORT FOR VERCEL
   ================================ */
module.exports = app
