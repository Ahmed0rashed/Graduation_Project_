const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Patient = require('../models/Patients.model'); 
const session = require("express-session");
require('dotenv').config({ path: __dirname + '/../config.env' }); 


const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;


passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "https://graduation-project-mmih.vercel.app/api/patientAuth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("Google profile does not have an email address"), null);
        }

        let user = await Patient.findOne({ email });

        if (!user) {
          user = new Patient({
            googleId: profile.id,
            email,
            firstName: profile.name?.givenName || "Unknown",
            lastName: profile.name?.familyName || "Unknown",
            gender: profile.gender || "Unspecified",  
            dateOfBirth: new Date("2000-01-01"),
            passwordHash: "google-auth",  
          });

          await user.save();
        }

        return done(null, user);
      } catch (error) {
        console.error(" Error in GoogleStrategy:", error);
        return done(error, null);
      }
    }
  )
);



passport.serializeUser((user, done) => {
  done(null, user.id);
});


passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
