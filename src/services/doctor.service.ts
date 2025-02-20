import { Doctor, Prisma } from "@prisma/client";
import { prisma } from "../prisma/prisma";

interface FilterDoctor {
  specialization?: string;
  minRating?: number;
  location?: string;
  availability?: string;
  consultationType?: string;
}
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

  async findDoctors(filters: FilterDoctor ): Promise<Doctor[]> {
    return prisma.doctor.findMany({
      where: {
        specialization: filters.specialization,
        ratings: { gte: filters.minRating },
        location: { contains: filters.location },
        consultationTypes: {
          path: [filters.consultationType],
          not: Prisma.JsonNull,
        },
        availability: { path: [filters.availability], not: Prisma.JsonNull },
      },
    });
  }

  async getDoctorAvailability(
    doctorId: string
  ): Promise<Record<string, string[]>> {
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    return (doctor?.availability as Record<string, string[]>) || {};
  }
}
