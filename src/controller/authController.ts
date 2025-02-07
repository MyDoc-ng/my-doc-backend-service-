import { NextFunction, Request, Response } from "express";
import { AuthService } from "../services/authService";
import jwt from "jsonwebtoken";
import { BadRequestException } from "../exception/bad-request";
import { ErrorCode } from "../exception/base";

const authService = new AuthService();

export class AuthController {
  // Register a new user
  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await authService.registerUser(req.body);
      res.status(201).json({ message: "User registered successfully", user });
    } catch (error: any) {
      next(error);
    }
  }

  // Register a new user
  async submitBiodata(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await authService.submitBiodata(req.body);
      res.status(201).json(user);
    } catch (error: any) {
      next(error);
    }
  }

  // Login user and generate a JWT token
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password }: { email: string; password: string } = req.body;
      const result = await authService.loginUser(email, password);

      if (result.token) {
        res.json(result);
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error: any) {
      next(error);
    }
  }

  async uploadUserPhoto(
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

  async googleAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    const { idToken } = req.body;

    if (!idToken) {
      next(
        new BadRequestException("ID token is required", ErrorCode.BADREQUEST)
      );
    }

    try {
      const data = await authService.verifyGoogleToken(idToken);

      return res.status(401).json({ data });
    } catch (error) {
      next(error);
    }
  }

  async appleAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    const { idToken, appleUserId } = req.body;

    if (!idToken || !appleUserId) {
      throw new BadRequestException(
        "ID token and Apple User ID are required",
        ErrorCode.BADREQUEST
      );
    }

    try {
      const data = await authService.verifyAppleToken(idToken, appleUserId);

      return res.status(401).json({ data });
      
    } catch (error) {
      next(error);
    }
  }
}
