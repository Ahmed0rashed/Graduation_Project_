const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
// const passport = require("passport");
// const session = require("express-session");
// const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require('./config/passport');


const pationtRouter = require('./routes/pationt.routes');
const adminRouter = require('./routes/auth.routes');
const RadiologistAuth = require('./routes/RadiologistAuth.routes');
const pationtAuth = require('./routes/PationtAuth.routes');



const app = express();



app.use(cors());

app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/patients", pationtRouter);
app.use("/api/auth", adminRouter);
app.use("/api/RadiologistAuth", RadiologistAuth);
app.use("/api/patientAuth", pationtAuth);


// app.use(session({
//     secret: "secretcode",
//     resave: true,
//     saveUninitialized: true
//   }));
  
//   passport.serializeUser((user, done) => {
//     done(null, user);
//   });
  
//   passport.deserializeUser((user, done) => {
//     done(null, user);
//   });
  
//   passport.use(
//     new GoogleStrategy(
//       {
//         clientID: process.env.GOOGLE_CLIENT_ID,
//         clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//         callbackURL: "http://localhost:8000/auth/google/callback",
//       },
//       (accessToken, refreshToken, profile, done) => {
//         done(null, profile);
//       }
//     )
//   );
  
//   app.use(passport.initialize());
//   app.use(passport.session());


module.exports = app;
