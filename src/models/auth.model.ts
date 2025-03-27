import { Gender } from "@prisma/client";

// Type for Register User Data
export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
}

export interface UserPhotoData {
  userId: string;
  photoPath: string;
}

// Type for Login Response
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  name: string;
  email: string;
  id: string;
}

// Type for Biodata Submission
export interface UserBioData {
  userId: string;
  dateOfBirth: string; // Ensure it is a valid date string
  gender: Gender; 
  phoneNumber: string;
  address: string;
}
