import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client
const prisma = new PrismaClient();

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


// Register a new user
export const registerUser = async (userData: RegisterUserData): Promise<any> => {
  const { name, email, password } = userData;

  try {
    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
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
  } catch (error: any) {
    throw new Error(error.message);
  }
};
// Register a new user
export const submitBiodata = async (userData: UserBioData): Promise<any> => {

  const { userId, dateOfBirth, gender, phoneNumber, address, medicalHistory } = userData;
  const { pastSurgeries = false, currentMeds = false, drugAllergies = false } = medicalHistory || {};

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        dateOfBirth,
        gender,
        phoneNumber,
        address,
        medicalHistory: {
          create: { pastSurgeries, currentMeds, drugAllergies },
        },
      },
      include : { medicalHistory: true }
    });
    

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      createdAt: updatedUser.createdAt,
    };
    
    res.status(200).json({ message: "Biodata submitted successfully", user: updatedUser });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Error updating biodata" });
  }

 
};

// Login user and generate a JWT token
export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

  return {
    token,
    name: user.name,
    email: user.email,
  };
};
