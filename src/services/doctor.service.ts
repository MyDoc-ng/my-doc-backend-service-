import { prisma } from "../prisma/prisma";

export class DoctorService {
  async getDoctors() {
    const users = await prisma.user.findMany();
    return users;
  }

  async getTopDoctors() {
    const doctors = await prisma.doctor.findMany({
      orderBy: { ratings: "desc" },
      take: 5,
    });

    return doctors;
  }
}
