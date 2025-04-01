import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/prisma";
import { BadRequestException } from "../exception/bad-request";
import { ErrorCode } from "../exception/base";
import { NotFoundException } from "../exception/not-found";
import {
  ILoginResponse,
  IRegisterDoctor,
  IRegisterUser,
  IUserBio,
  IUserPhoto,
} from "../models/auth.model";
import { OAuth2Client } from "google-auth-library";
import { generateVerificationToken } from "../utils/generate_verify_token";
import { EmailService } from "./email.service";
import { checkIfUserExists } from "../utils/checkIfUserExists";
import { EmailTemplates } from "../emails/emailTemplates";
import { User, UserTypes } from "@prisma/client";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export class AuthService {
  // Register a new user
  static async registerUser(userData: IRegisterUser): Promise<any> {
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

  static async registerDoctors(data: IRegisterDoctor) {
    const {
      name,
      email,
      password
    } = data;

    const doctorExists = await checkIfUserExists(data.email);

    if (doctorExists) {
      throw new BadRequestException(
        "Doctor with this email already exists",
        ErrorCode.CONFLICT
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);


    const newDoctor = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: UserTypes.DOCTOR,
      },
    });

    return newDoctor;
  }

  static async submitBiodata(userData: IUserBio): Promise<any> {
    const {
      userId,
      dateOfBirth,
      gender,
      phoneNumber,
      address,
    } = userData;

    const userExists = await checkIfUserExists(userId);

    if (!userExists) {
      throw new NotFoundException("User not found", ErrorCode.NOTFOUND);
    }

    const updatedUser = await prisma.patientProfile.upsert({
      where: { userId },
      update: {
        dateOfBirth: new Date(dateOfBirth),
        gender,
        phoneNumber,
        address,
      },
      create: {
        userId,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        phoneNumber,
        address,
      },
      include: { user: true }
    });

    return {
      id: updatedUser.user.id,
      name: updatedUser.user.name,
      email: updatedUser.user.email,
      createdAt: updatedUser.user.createdAt,
    };
  }

  // Login user and generate a JWT token
  static async loginUser(
    email: string,
    password: string
  ): Promise<ILoginResponse> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, password: true, role: true, patientProfile: true },
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
      id: user.id,
      email: user.email,
      name: user.name,
      photo: user.patientProfile?.profilePicture,
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }

  static async updateUserPhoto(data: IUserPhoto): Promise<any> {
    const { userId, photoPath } = data;

    const userExists = await checkIfUserExists(userId);

    if (!userExists) {
      throw new NotFoundException("User not found", ErrorCode.NOTFOUND);
    }

    const updatedUser = await prisma.patientProfile.update({
      where: { userId },
      data: { profilePicture: photoPath },
      include: { user: true }
    });

    return {
      id: updatedUser.user.id,
      name: updatedUser.user.name,
      email: updatedUser.user.email,
      photo: updatedUser.profilePicture,
    };
  }

  static async verifyGoogleToken(idToken: string): Promise<any> {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_BACKEND_ID as string,
    });

    const payload = ticket.getPayload();

    if (!payload || Date.now() / 1000 > payload.exp) {
      throw new BadRequestException("Invalid Google token", ErrorCode.BADREQUEST);
    }

    const { sub: googleId, email, name, picture } = payload;

    // Start a Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      let user = await tx.user.upsert({
        where: { email: email },
        update: {
          googleId: googleId,
          name: name || "",
          verificationToken: generateVerificationToken(),
        },
        create: {
          googleId: googleId,
          email: email || "",
          name: name || "",
          verificationToken: generateVerificationToken(),
        },
      });

      // Update profile picture in the PatientProfile table
      await tx.patientProfile.updateMany({
        where: { userId: user.id },
        data: { profilePicture: picture || "" },
      });

      // Store refresh token in database
      const refreshToken = generateRefreshToken(user);
      await tx.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      return { user, refreshToken };
    });

    // Generate access token
    const accessToken = generateAuthToken(result.user);

    // Send verification email if email is not verified
    if (!result.user.emailVerified) {
      try {
        await AuthService.sendVerificationEmail(
          result.user.name,
          result.user.email,
          result.user.verificationToken!
        );
      } catch (error) {
        throw error;
      }
    }

    return {
      accessToken,
      refreshToken: result.refreshToken,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        photo: picture,
      },
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
    name: string,
    email: string,
    verificationToken: string
  ): Promise<void> {
    const baseUrl = process.env.APP_URL || "http://localhost:8000"; // Default fallback

    const verificationLink = `${baseUrl}/users/verify-email?token=${verificationToken}`;

    try {
      await EmailService.sendEmail({
        to: email,
        subject: "Verify Your Email Address",
        templateName: EmailTemplates.VERIFICATION,
        replacements: { name, verificationLink }
      });
    } catch (error) {
      throw new BadRequestException("Failed to send verification email", ErrorCode.BADREQUEST);
    }
  }
}

function generateAuthToken(user: any) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET as string, {
    expiresIn: "10h",
  });
}

function generateRefreshToken(user: any) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.REFRESH_SECRET as string, {
    expiresIn: "7d",
  });
}
