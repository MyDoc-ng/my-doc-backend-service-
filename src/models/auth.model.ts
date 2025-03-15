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
}

// Type for Biodata Submission
export interface UserBioData {
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
