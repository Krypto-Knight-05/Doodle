const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userModel");

// ── Local Strategy ──────────────────────────────────────────────────────────
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
          return done(null, false, { message: "No account found with that email." });
        }
        if (!user.passwordHash) {
          return done(null, false, { message: "This account uses Google login. Please sign in with Google." });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ── Google OAuth Strategy ───────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID_HERE") {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:4444/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Try to find existing user by Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            // Try to find by email (user may have registered with email first)
            const email = profile.emails?.[0]?.value;
            user = await User.findOne({ email });

            if (user) {
              // Link Google account to existing email account
              user.googleId = profile.id;
              user.avatar = user.avatar || profile.photos?.[0]?.value;
              await user.save();
            } else {
              // Create brand new user via Google
              user = await User.create({
                name: profile.displayName,
                email: profile.emails?.[0]?.value,
                googleId: profile.id,
                avatar: profile.photos?.[0]?.value,
                passwordHash: null,
              });
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

// ── Serialization ───────────────────────────────────────────────────────────
passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select("-passwordHash");
    done(null, user);
  } catch (err) {
    done(err);
  }
});
