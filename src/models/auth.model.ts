import { Gender, UserRole, UserTypes } from "@prisma/client";

// Type for Register User Data
export interface IRegisterUser {
  name: string;
  email: string;
  password: string;
  role: UserTypes;
}

export interface IUserPhoto {
  userId: string;
  photoPath: string;
}

export interface IUserDocumentFiles {
  cvDoc?: Express.Multer.File[];
  medicalLicenseDoc?: Express.Multer.File[];
  referenceDoc?: Express.Multer.File[];
  specializationCertDoc?: Express.Multer.File[];
  idDoc?: Express.Multer.File[];
}

export interface IRole {
  // id: string;
  name: string;
}

// Type for Login Response
export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  name: string;
  email: string;
  roles: IRole[];
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
  medicalHistory: {
    pastSurgeries: string;
    currentMeds: string;
    drugAllergies: string;
  };
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
