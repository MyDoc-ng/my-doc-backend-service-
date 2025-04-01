import { Gender } from "@prisma/client";

// Type for Register User Data
export interface IRegisterUser {
  name: string;
  email: string;
  password: string;
}
export interface IRegisterDoctor {
  name: string;
  email: string;
  password: string;
}

export interface IUserPhoto {
  userId: string;
  photoPath: string;
}

// Type for Login Response
export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  name: string;
  email: string;
  id: string;
  photo: string | null | undefined;
}

// Type for Biodata Submission
export interface IUserBio {
  userId: string;
  dateOfBirth: string; // Ensure it is a valid date string
  gender: Gender; 
  phoneNumber: string;
  address: string;
}
export interface IUpdateProfile {
  userId: string;
  dateOfBirth: string; // Ensure it is a valid date string
  gender: Gender; 
  phoneNumber: string;
  name: string;
  email: string;
}
export interface IChangePassword {
  userId: string;
  newPassword: string;
  currentPassword: string; 
}
