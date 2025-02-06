const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const passport = require('./config/passport');
const radiologistRouter = require("./routes/Radiologist.Routes");
const pationtRouter = require('./routes/pationt.routes');
const adminRouter = require('./routes/RadiologyCenterAuth.routes');
const RadiologistAuth = require('./routes/RadiologistAuth.routes');
const pationtAuth = require('./routes/PationtAuth.routes');
const aireports = require('./routes/AIReports.routes');

const app = express();

app.use(cors());

app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/api/radiologists", radiologistRouter);
app.use("/api/patients", pationtRouter);
app.use("/api/auth", adminRouter);
app.use("/api/RadiologistAuth", RadiologistAuth);
app.use("/api/patientAuth", pationtAuth);
app.use("/api/AIReports", aireports)


module.exports = app;
