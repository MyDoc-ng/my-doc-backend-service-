import { prisma } from "../prisma/prisma";

// Function to check if ID exists in User or Doctor table
export const checkIfUserExists = async (id: string, type: "USER" | "DOCTOR") => {
    if (type === "USER") {
      return await prisma.user.findUnique({ where: { id } });
    }
    if (type === "DOCTOR") {
      return await prisma.doctor.findUnique({ where: { id } });
    }
    return null;
  };
  