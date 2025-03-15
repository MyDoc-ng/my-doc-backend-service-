import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/prisma";
import { BadRequestException } from "../exception/bad-request";
import { ErrorCode } from "../exception/base";
import { NotFoundException } from "../exception/not-found";
import {
  LoginResponse,
  RegisterUserData,
  UserBioData,
  UserPhotoData,
} from "../models/auth.model";
import { OAuth2Client } from "google-auth-library";
import { generateVerificationToken } from "../utils/generate_verify_token";
import { EmailService } from "./email.service";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export class AuthService {
  // Register a new user
  static async registerUser(userData: RegisterUserData): Promise<any> {
    const { name, email, password } = userData;

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException(
        "User with this email already exists",
        ErrorCode.CONFLICT
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  static async submitBiodata(userData: UserBioData): Promise<any> {
    const {
      userId,
      dateOfBirth,
      gender,
      phoneNumber,
      address,
      medicalHistory,
    } = userData;

    const {
      pastSurgeries = false,
      currentMeds = false,
      drugAllergies = false,
    } = medicalHistory || {};

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        dateOfBirth: new Date(dateOfBirth),
        gender,
        phoneNumber,
        address,
        medicalHistory: {
          create: { pastSurgeries, currentMeds, drugAllergies },
        },
      },
      include: { medicalHistory: true },
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      createdAt: updatedUser.createdAt,
    };
  }

  // Login user and generate a JWT token
  static async loginUser(
    email: string,
    password: string
  ): Promise<LoginResponse> {
    const user = await prisma.user.findFirst({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found", ErrorCode.NOTFOUND);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password!);

    if (!isPasswordValid) {
      throw new BadRequestException(
        "Incorrect password",
        ErrorCode.UNAUTHORIZED
      );
    }

    const accessToken = generateAuthToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      name: user.name,
      email: user.email,
    };
  }

  static async updateUserPhoto(data: UserPhotoData): Promise<any> {
    const { userId, photoPath } = data;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePicture: photoPath },
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      photo: updatedUser.profilePicture,
    };
  }

  static async verifyGoogleToken(idToken: string): Promise<any> {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_BACKEND_ID as string,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new BadRequestException(
        "Invalid Google token",
        ErrorCode.BADREQUEST
      );
    }

    const { sub: googleId, email, name, picture } = payload;

    let user = await prisma.user.upsert({
      where: { email: email },
      update: {
        googleId: googleId,
        name: name || "",
        profilePicture: picture || "",
        verificationToken: generateVerificationToken(),
      },
      create: {
        googleId: googleId,
        email: email || "",
        name: name || "",
        profilePicture: picture || "",
        verificationToken: generateVerificationToken(),
      },
    });

    if (!user.emailVerified) {
      try {
        await AuthService.sendVerificationEmail(
          user.email,
          user.verificationToken!
        );
      } catch (error) {
        console.error("Error sending verification email:", error);
      }
    }

    // Generate both access and refresh tokens
    const accessToken = generateAuthToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        photo: user.profilePicture
      }
    };
  }


  static async refreshAccessToken(refreshToken: string) {
    if (!refreshToken)
      throw new BadRequestException("Refresh token is required", ErrorCode.FORBIDDEN);

    // Find Refresh Token in DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }, // Include user data
    });

    if (!storedToken)
      throw new BadRequestException(
        "Invalid refresh token",
        ErrorCode.FORBIDDEN
      );

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      });
      throw new BadRequestException(
        "Refresh token has expired",
        ErrorCode.FORBIDDEN
      );
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_SECRET as string
      ) as any;

      // Generate new tokens
      const newAccessToken = generateAuthToken(storedToken.user);
      const newRefreshToken = generateRefreshToken(storedToken.user);

      // Implement refresh token rotation - delete old and create new
      await prisma.$transaction([
        prisma.refreshToken.delete({
          where: { token: refreshToken },
        }),
        prisma.refreshToken.create({
          data: {
            token: newRefreshToken,
            userId: decoded.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        }),
      ]);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      // Delete invalid token
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      });
      throw new BadRequestException(
        "Invalid or expired refresh token",
        ErrorCode.FORBIDDEN
      );
    }
  }


  static async sendVerificationEmail(
    email: string,
    verificationToken: string
  ): Promise<void> {
    const verificationLink = `${process.env.APP_URL}/api/auth/verify-email?token=${verificationToken}`;
    const html = `Click <a href="${verificationLink}">here</a> to verify your email address.`;

    try {
      await EmailService.sendEmail({
        to: email,
        subject: "Verify Your Email Address",
        html: html,
      });
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw new Error("Failed to send verification email");
    }
  }
}

function generateAuthToken(user: any) {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
    expiresIn: "10h",
  });
}

function generateRefreshToken(user: any) {
  return jwt.sign({ id: user.id }, process.env.REFRESH_SECRET as string, {
    expiresIn: "7d",
  });
}
