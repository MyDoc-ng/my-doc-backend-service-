import { prisma } from "../prisma/prisma";

export class UserService {
  async getUsers() {
    const users = await prisma.user.findMany();
    return users;
  }
}
