import { NextFunction, Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { prisma } from "../prisma/prisma";
import { BadRequestException } from "../exception/bad-request";
import { ErrorCode } from "../exception/base";

export class AuthController {
  // Register a new user
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.createUser(req.body);
      res.status(result.status ?? 200).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  // Register a new user
  static async submitBiodata(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.submitBiodata(req.body);
      res.status(result.status ?? 200).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  // Login user and generate a JWT token
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password }: { email: string; password: string } = req.body;

      const result = await AuthService.loginUser(email, password);

      res.status(result.status ?? 200).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  static async uploadUserPhoto(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.file) {
        throw new BadRequestException("No file selected", ErrorCode.BADREQUEST);
      }

      const userId = req.body.userId;
      let photoPath = req.file.path;

      const serverUrl = `${req.protocol}://${req.get("host")}`;

      photoPath = `${serverUrl}/${photoPath.replace(/\\/g, "/")}`;

      const result = await AuthService.updateUserPhoto({ photoPath, userId });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async uploadDocuments(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.body.userId;
      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      const result = await AuthService.saveUserDocuments(userId, files, req);

      res.status(result.status ?? 200).json(result);

    } catch (error) {
      next(error);
    }
  }

  static async updateDoctorCompliance(req: Request, res: Response, next: NextFunction) {

    try {
      const result = await AuthService.updateCompliance(req.body);

      res.status(result.status ?? 200).json(result);
    } catch (error) {
      next(error);
    }
  };

  static async googleAuth(req: Request, res: Response, next: NextFunction): Promise<any> {
    const { idToken } = req.body;

    try {
      const data = await AuthService.verifyGoogleToken(idToken); // Verify the token with Google's servers.
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { refreshToken } = req.body;

      const result = await AuthService.refreshAccessToken(refreshToken);

      return res.status(result.status ?? 200).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<any> {
    const userId = req.body?.id;

    try {
      const result = await AuthService.logout(userId);
      res.status(result.status ?? 200).json(result);
    } catch (error: any) {
      next(error);
    }
  }


  // static async oAuth2Callback(req: Request, res: Response): Promise<any> {
  //   const code = req.query.code as string;
  //   const state = req.query.state as string;

  //   try {
  //     const { tokens, calendarId } = await handleOAuthCallback(code);

  //     const [entityType, entityIdStr] = state.split("_");
  //     const entityId = parseInt(entityIdStr);

  //     if (entityType === "doctor" || entityType === "user") {
  //       await saveTokensAndCalendarId({
  //         entityType: entityType,
  //         entityId: entityId,
  //         tokens: tokens,
  //         calendarId: calendarId,
  //       });
  //       res.send(
  //         `${entityType.charAt(0).toUpperCase() + entityType.slice(1)
  //         } Google Calendar connected successfully!`
  //       );
  //     } else {
  //       return res.status(400).send("Invalid state.");
  //     }
  //   } catch (error) {
  //     console.error("Error during Google OAuth2 flow:", error);
  //     res.status(500).send("Error connecting to Google Calendar.");
  //   }
  // }

  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<any> {
    const { token } = req.body;

    try {
      const result = await AuthService.verifyEmail(token);

      return res.status(result.status ?? 200).json(result);

    } catch (error) {
      next(error);
    }
  }
}
