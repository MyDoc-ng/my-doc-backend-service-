import { prisma } from "../prisma/prisma";

export const checkIfUserExists = async (id: string) => {

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id },
        { email: id }
      ]
    },
  });

  if (user) {
    return user;
  }

  return null;
};
