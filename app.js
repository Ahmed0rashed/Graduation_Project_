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
const record = require('./routes/radiologyRecords.routes');
const RadiologyCenter = require("./routes/RadiologyCenter.Routes");
const massage = require("./routes/Char.routes");

const CenterRadiologistsRelationRoutes = require('./routes/CenterRadiologistsRelation.Routes');


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

app.use("/api/Record",record);  
app.use("/api/centers", RadiologyCenter);

app.use('/api/messages', massage);

app.use("/api/relations", CenterRadiologistsRelationRoutes);

module.exports = app;
