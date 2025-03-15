import { NextFunction, Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import {
  handleOAuthCallback,
  saveTokensAndCalendarId,
} from "../utils/oauthUtils";
import { prisma } from "../prisma/prisma";

export class AuthController {
  // Register a new user
  static async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await AuthService.registerUser(req.body);
      res
        .status(201)
        .json({ message: "User registered successfully", data: user });
    } catch (error: any) {
      next(error);
    }
  }

  // Register a new user
  static async submitBiodata(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await AuthService.submitBiodata(req.body);
      res.status(201).json(user);
    } catch (error: any) {
      next(error);
    }
  }

  // Login user and generate a JWT token
  static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password }: { email: string; password: string } = req.body;
      const result = await AuthService.loginUser(email, password);

      if (result.accessToken) {
        res.json(result);
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error: any) {
      next(error);
    }
  }

  static async uploadUserPhoto(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.body.userId;
      const photoPath = req.file.path;

      const updatedUser = await authService.updateUserPhoto({
        photoPath,
        userId,
      });

      res.status(200).json({
        message: "Photo uploaded successfully",
        user: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  static async googleAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    const { idToken } = req.body;

    try {
      const data = await AuthService.verifyGoogleToken(idToken); // Verify the token with Google's servers.

      res.json({ message: "Google login successful", data });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const { refreshToken } = req.body;

      const tokens = await AuthService.refreshAccessToken(refreshToken);

      return res.status(200).json({
        status: "success",
        data: tokens,
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response): Promise<any> {
    const { token } = req.body;

    // Delete Refresh Token from DB
    await prisma.refreshToken.deleteMany({ where: { token } });

    res.json({ message: "Logged out successfully" });
  }

  static async oAuth2Callback(req: Request, res: Response): Promise<any> {
    const code = req.query.code as string;
    const state = req.query.state as string;

    try {
      const { tokens, calendarId } = await handleOAuthCallback(code);

      const [entityType, entityIdStr] = state.split("_");
      const entityId = parseInt(entityIdStr);

      if (entityType === "doctor" || entityType === "user") {
        await saveTokensAndCalendarId({
          entityType: entityType,
          entityId: entityId,
          tokens: tokens,
          calendarId: calendarId,
        });
        res.send(
          `${entityType.charAt(0).toUpperCase() + entityType.slice(1)
          } Google Calendar connected successfully!`
        );
      } else {
        return res.status(400).send("Invalid state.");
      }
    } catch (error) {
      console.error("Error during Google OAuth2 flow:", error);
      res.status(500).send("Error connecting to Google Calendar.");
    }
  }

  static async verifyEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).send("Invalid verification token.");
    }

    try {
      const user = await prisma.user.findFirst({
        where: { verificationToken: token },
      });

      if (!user) {
        return res.status(400).send("Invalid or expired verification token.");
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, verificationToken: null },
      });

      res.status(201).json("Email verified successfully!");
    } catch (error) {
      next(error);
      console.error("Error verifying email:", error);
      res.status(500).send("An error occurred while verifying your email.");
    }
  }
}
