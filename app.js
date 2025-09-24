const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const passport = require("./config/passport");
const { generalLimiter, authLimiter, strictLimiter, passwordResetLimiter, otpLimiter, uploadLimiter } = require("./middleware/rateLimiter");
const radiologistRouter = require("./routes/Radiologist.Routes");
const pationtRouter = require("./routes/pationt.routes");
const adminRouter = require("./routes/RadiologyCenterAuth.routes");
const RadiologistAuth = require("./routes/RadiologistAuth.routes");
const pationtAuth = require("./routes/PationtAuth.routes");
const aireports = require("./routes/AIReports.routes");
const record = require("./routes/radiologyRecords.routes");
const RadiologyCenter = require("./routes/RadiologyCenter.Routes");
const massage = require("./routes/Char.routes");
const paymentRoutes = require("./routes/payment.routes");
const walletRoutes = require("./routes/wallet.routes");

const CenterRadiologistsRelationRoutes = require("./routes/CenterRadiologistsRelation.Routes");

const notificationRoutes = require("./routes/not");
const dashboardRoutes = require("./routes/dashboard.routes");
const radiologistDashboardRoutes = require("./routes/RadiologistDashboard.routes");

const Admin = require("./routes/admon.routes");
const comment = require("./routes/comment.routes");

const app = express();

app.use(cors());

app.use(morgan("dev"));

// Apply general rate limiting to all routes
app.use("/api/", generalLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/radiologists", radiologistRouter);
app.use("/api/patients", pationtRouter);
// Apply strict rate limiting to authentication routes
app.use("/api/auth", authLimiter, adminRouter);
app.use("/api/RadiologistAuth", authLimiter, RadiologistAuth);
app.use("/api/patientAuth", authLimiter, pationtAuth);
app.use("/api/AIReports", aireports);

app.use("/api/Record", record);
app.use("/api/centers", RadiologyCenter);

app.use("/api/messages", massage);

app.use("/api/relations", CenterRadiologistsRelationRoutes);
app.use("/api/notifications", notificationRoutes);

app.use("/api/admin", Admin);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/radiologistDashboard", radiologistDashboardRoutes);
app.use("/api/comments", comment);
app.use("/api/payments", paymentRoutes);
app.use("/api/wallet", walletRoutes);
module.exports = app;
