import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/prisma";
import { BadRequestException } from "../exception/bad-request";
import { ErrorCode } from "../exception/base";


// Type for Register User Data
interface RegisterUserData {
  name: string;
  email: string;
  password: string;
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

  // Register a new user
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
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
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
}
