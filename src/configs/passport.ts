import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import { prisma } from "../prisma/prisma";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_REDIRECT_URI!,
      scope: ["profile", "email", "https://www.googleapis.com/auth/calendar"],
      accessType: "offline",
      prompt: "consent",
    },
    async (accessToken, refreshToken, profile, done) => {
      const { id, displayName, emails } = profile;
      const email = emails?.[0]?.value;
      if (!email) return done(new Error("No email found"), null);

      // Check if the user exists in either table
      let user = await prisma.user.findUnique({ where: { googleId: id } });
      let doctor = await prisma.doctor.findUnique({ where: { googleId: id } });

      if (user) return done(null, user);

      if (doctor) {
        doctor = await prisma.doctor.update({
          where: { googleId: id },
          data: { accessToken, refreshToken },
        });
        return done(null, doctor);
      }

      return done(null, null);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

export default passport;
