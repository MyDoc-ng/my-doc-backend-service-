import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/prisma";
import { BadRequestException } from "../exception/bad-request";
import { ErrorCode } from "../exception/base";
import { NotFoundException } from "../exception/not-found";
import {
  IRegisterUser,
  IUserBio,
  IUserPhoto,
} from "../models/auth.model";
import { OAuth2Client } from "google-auth-library";
import { generateVerificationToken } from "../utils/generate_verify_token";
import { EmailService } from "./email.service";
import { checkIfUserExists } from "../utils/checkIfUserExists";
import { EmailTemplates } from "../emails/emailTemplates";
import { RegistrationStep, UserTypes } from "@prisma/client";
import { responseService } from "./response.service";
import { transformUserRoles } from "../utils/role.utils";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export class AuthService {
  /**
   * Register new User
   */
  static async createUser(data: IRegisterUser) {
    const { name, email, password, role } = data;

    const userExists = await checkIfUserExists(data.email);

    const roles = transformUserRoles(userExists?.roles);

    if (userExists) {
      return responseService.error({
        message: "User already exists",
        status: responseService.statusCodes.conflict,
        data: {
          id: userExists.id,
          name: userExists.name,
          email: userExists.email,
          createdAt: userExists.createdAt,
          roles: roles
        }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verificationToken: generateVerificationToken(),
        registrationStep: RegistrationStep.CREATE_ACCOUNT,
      },
    });
    // Assign default role to user
    await this.addRoleToUser(newUser.id, role ?? UserTypes.PATIENT);

    const userWithRoles = await prisma.user.findUnique({
      where: { id: newUser.id },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    await this.sendVerificationEmail(
      newUser.name,
      newUser.email,
      newUser.verificationToken!
    );

    return responseService.success({
      message: "User registered successfully",
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        roles: transformUserRoles(userWithRoles?.roles),
        verificationToken: newUser.verificationToken,
        createdAt: newUser.createdAt,
      }
    });
  }

  static async submitBiodata(userData: IUserBio): Promise<any> {
    const { userId, dateOfBirth, gender, phoneNumber, address, medicalHistory } = userData;

    const userExists = await checkIfUserExists(userId);

    if (!userExists) {
      return responseService.notFoundError({
        message: "User not found",
      });
    }

    const updatedUser = await prisma.$transaction(async (prisma) => {
      // First update/create the patient profile
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          dateOfBirth,
          gender,
          phoneNumber,
          address,
          registrationStep: RegistrationStep.CREATE_BIODATA,
        },
        include: {
          roles: {
            include: { role: true }
          }
        }
      });

      if (medicalHistory) {
        await prisma.medicalHistory.upsert({
          where: { userId },
          create: {
            userId,
            pastSurgeries: medicalHistory.pastSurgeries,
            currentMeds: medicalHistory.currentMeds,
            drugAllergies: medicalHistory.drugAllergies,
          },
          update: {
            pastSurgeries: medicalHistory.pastSurgeries,
            currentMeds: medicalHistory.currentMeds,
            drugAllergies: medicalHistory.drugAllergies,
          }
        });
      }

      // Return the updated user data
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        dateOfBirth: dateOfBirth,
        roles: transformUserRoles(user.roles),
        photo: user.profilePicture,
        registerationStep: user.registrationStep,
      }
    });

    return responseService.success({
      message: "Biodata submitted successfully",
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        dateOfBirth: updatedUser.dateOfBirth,
        roles: updatedUser.roles,
        photo: updatedUser.photo,
      }
    });
  }


  // Login user and generate a JWT token
  static async loginUser(email: string, password: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        profilePicture: true,
        roles: {
          include: { role: true },
        },
        patientProfile: true
      },
    });

    if (!user) {
      return responseService.notFoundError({
        message: "Incorrect password",
      });
    }

    if (!user?.roles?.length) {
      return responseService.error({
        message: "You have not completed your account creation, please continue"
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password!);

    if (!isPasswordValid) {
      return responseService.error({
        message: "Incorrect password",
      });
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

    return responseService.success({
      message: "Logged In Successfully",
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: transformUserRoles(user.roles),
        photo: user.profilePicture,
        accessToken: accessToken,
        refreshToken: refreshToken,
      }
    });
  }

  static async updateUserPhoto(data: IUserPhoto): Promise<any> {
    const { userId, photoPath } = data;

    const userExists = await checkIfUserExists(userId);

    if (!userExists) {
      return responseService.notFoundError({
        message: "User not found",
      });
    }

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
        },
        create: {
          googleId: googleId,
          email: email || "",
          name: name || "",
          verificationToken: generateVerificationToken(),
        },
      });

      await tx.user.update({
        where: { id: user.id },
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


    return responseService.success({
      message: "Logged In Successfully",
      data: {
        accessToken,
        refreshToken: result.refreshToken,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          photo: picture,
        },
      }
    });
  }

  static async verifyEmail(token: string): Promise<any> {
    if (!token || typeof token !== "string") {
      return responseService.error({
        message: "Invalid verification token.",
      });
    }

    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return responseService.error({
        message: "Invalid or expired verification token.",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null },
    });

    return responseService.success({
      message: "Email verified successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        photo: user.profilePicture,
        RegistrationStep: RegistrationStep.VERIFY,
        roles: transformUserRoles(user.roles),
      }
    });
  }

  static async logout(userId: string): Promise<any> {
    // Delete all Refresh Tokens for the user
    await prisma.refreshToken.deleteMany({ where: { userId } });

    return responseService.success({
      message: "Logged out successfully",
      data: []
    });
  }

  static async deleteAccount(userId: string): Promise<any> {
    // Delete all Refresh Tokens for the user
    await prisma.refreshToken.deleteMany({ where: { userId } });

    // Delete user account
    await prisma.user.delete({ where: { id: userId } });

    return responseService.success({
      message: "Account deleted successfully",
      data: []
    });
  }

  static async refreshAccessToken(refreshToken: string) {

    if (!refreshToken) {
      return responseService.error({
        message: "Refresh token is required",
      });
    }

    
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });
    
    if (!storedToken) {
      return responseService.notFoundError({
        message: "Refresh not found",
      });
    }


    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      });

      return responseService.error({
        message: "Refresh has expired",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET as string) as any;

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

      return responseService.success({
        message: "Token refreshed successfully",
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        }
      });

    } catch (error) {
      // Delete invalid token
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      });

      return responseService.error({
        message: "Invalid or expired refresh token",
      });
    }
  }

  static async sendVerificationEmail(name: string, email: string, verificationToken: string): Promise<void> {
    const baseUrl = process.env.FRONTEND_APP_URL || "http://localhost:8000"; // Default fallback

    const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;

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

  static async addRoleToUser(userId: string, roleName: UserTypes) {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found`, ErrorCode.NOTFOUND);
    }

    const existingRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId: role.name,
        },
      },
    });

    if (existingRole) {
      return { message: `User already has role ${roleName}` };
    }

    await prisma.userRole.create({
      data: {
        user: { connect: { id: userId } },
        role: { connect: { id: role.id } },
      },
    });

    return { message: `User assigned role ${roleName}` };
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



