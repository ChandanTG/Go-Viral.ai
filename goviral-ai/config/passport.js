const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const AppleStrategy = require('passport-apple');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

module.exports = function (passport) {
  // Local Strategy
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase(), authProvider: 'local' });
        if (!user) {
          return done(null, false, { message: 'No local account found with that email.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  // Google Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });
          if (user) return done(null, user);

          // Check if email already exists
          user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });
          if (user) {
            // Link account if it was local or apple
            user.googleId = profile.id;
            user.authProvider = 'google'; // Prefer Google if linked
            await user.save();
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value.toLowerCase(),
            googleId: profile.id,
            authProvider: 'google',
            isActive: true,
            otpVerified: true, // OAuth verified by default
          });
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Apple Strategy (Requires Setup)
  passport.use(
    new AppleStrategy(
      {
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH,
        callbackURL: process.env.APPLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, idToken, profile, done) => {
        try {
          // Apple profile is only sent the first time
          const appleId = profile.id;
          let user = await User.findOne({ appleId });
          if (user) return done(null, user);

          const email = profile.email ? profile.email.toLowerCase() : null;
          if (email) {
            user = await User.findOne({ email });
            if (user) {
              user.appleId = appleId;
              user.authProvider = 'apple';
              await user.save();
              return done(null, user);
            }
          }

          user = await User.create({
            name: (profile.name && profile.name.firstName) ? `${profile.name.firstName} ${profile.name.lastName}` : 'Apple User',
            email: email,
            appleId: appleId,
            authProvider: 'apple',
            isActive: true,
            otpVerified: true,
          });
          return done(null, user);
        } catch (err) {
          return done(err);
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
    } catch (err) {
      done(err);
    }
  });
};
