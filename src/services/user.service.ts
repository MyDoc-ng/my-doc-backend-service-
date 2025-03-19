import { AppointmentStatus } from "@prisma/client";
import { ErrorCode } from "../exception/base";
import { NotFoundException } from "../exception/not-found";
import { prisma } from "../prisma/prisma";

export class UserService {

  async getUsers() {
    const users = await prisma.user.findMany();
    return users;
  }

  async getUserById(id: string) {
    return await prisma.user.findUnique({ where: { id } });
  }

  static async getUpcomingConsultations(userId: string) {

    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userExists) {
      throw new NotFoundException("User not found", ErrorCode.NOTFOUND);
    }

    return await prisma.consultation.findMany({
      where: {
        patientId: userId,
        status: AppointmentStatus.UPCOMING
      },
      orderBy: {
        startTime: 'asc'
      },
      include: {
        patient: true,
        doctor: true,
      },
    });
  }


  

}
