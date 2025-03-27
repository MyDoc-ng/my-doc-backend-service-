import { prisma } from "../prisma/prisma";

export const checkIfUserExists = async (id: string) => {

  const user = await prisma.user.findUnique({ where: { id } });
  
  if (user) {
    return user;
  }

  return null;
};
