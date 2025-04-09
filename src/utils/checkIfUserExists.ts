import { prisma } from "../prisma/prisma";

export const checkIfUserExists = async (id: string) => {

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id },
        { email: id }
      ]
    },
    include: {
      roles: {
        include: {
          role: true
        }
      },
    },
  });

  if (user) {
    return user;
  }

  return null;
};
