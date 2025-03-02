import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/prisma";
import { BadRequestException } from "../exception/bad-request";
import { ErrorCode } from "../exception/base";
import { NotFoundException } from "../exception/not-found";
import appleSigninAuth from 'apple-signin-auth';



// Type for Register User Data
interface RegisterUserData {
  name: string;
  email: string;
  password: string;
}
interface UserPhotoData {
  userId: string;
  photoPath: string;
}

// Type for Login Response
interface LoginResponse {
  token: string;
  name: string;
  email: string;
}

// Type for Biodata Submission
interface UserBioData {
  userId: string;
  dateOfBirth: string; // Ensure it is a valid date string
  gender: "MALE" | "FEMALE"; // Updated enum representation to include "OTHER" if applicable
  phoneNumber: string;
  address: string;
  medicalHistory?: {
    pastSurgeries: boolean;
    currentMeds: boolean;
    drugAllergies: boolean;
  }; // Optional object to match the MedicalHistory model
}

export class AuthService {
  // Register a new user
  async registerUser(userData: RegisterUserData): Promise<any> {
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

  async submitBiodata(userData: UserBioData): Promise<any> {
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
  async loginUser(email: string, password: string): Promise<LoginResponse> {
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

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: "1h",
    });

    return {
      token,
      name: user.name,
      email: user.email,
    };
  }

  async updateUserPhoto(data: UserPhotoData): Promise<any> {
    const { userId, photoPath } = data;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { photo: photoPath },
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      photo: updatedUser.photo,
    };
  }

  async verifyGoogleToken(idToken: string): Promise<any> {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID as string,
    });

    const payload = ticket.getPayload()!;

    if (!payload) {
      throw new BadRequestException("Invalid ID token", ErrorCode.BADREQUEST);
    }

    const { sub: googleId, email, name, picture } = payload;

    // Check or create user in database
    let user = await prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId,
          email: email || "",
          name: name || "",
          photo: picture || "",
        },
      });
    }

    // Generate a token (e.g., JWT or session token)
    const token = generateAuthToken(user);

    return { token, user };
  }
  
  async verifyAppleToken(idToken: string): Promise<any> {
    
    const decodedToken = await appleSigninAuth.verifyIdToken(idToken,{
      audience: process.env.APP_BUNDLE_ID as string,
      ignoreExpiration: false,
    });

    if (!decodedToken) {
      throw new BadRequestException('Invalid Apple ID token', ErrorCode.BADREQUEST);
    }

    const { sub: appleId, email } = decodedToken;

    // Check if user exists in the database
    let appleUser = await prisma.user.findUnique({
      where: { appleId },
    });

   // If the user doesn't exist, create a new user
   if (!appleUser) {
    appleUser = await prisma.user.create({
      data: {
        appleId,
        email: email || '', 
        name: '',
      },
    });
  }

    // Generate a token (e.g., JWT or session token)
    const token = generateAuthToken(appleUser);

    return { token, appleUser };
  }
}

function generateAuthToken(user: any) {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
    expiresIn: "10h",
  });
}
