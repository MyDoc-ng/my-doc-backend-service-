import { ConsultationType, Doctor, Prisma } from "@prisma/client";
import { prisma } from "../prisma/prisma";

interface FilterDoctor {
  specialization?: string;
  minRating?: number;
  location?: string;
  availability?: string;
  consultationType?: ConsultationType;
}

interface AvailabilitySlot {
  start: string;
  end: string;
}

interface Availability {
  day: string;
  slots: AvailabilitySlot[];
}

interface DoctorProfile {
  userId: string;
  specialization: string;
  experienceYears: number;
  ratings: number;
  bio: string;
  isOnline: boolean;
  availability: Prisma.JsonValue[];
}

export class DoctorService {
  async getDoctors() {
    const users = await prisma.user.findMany();
    return users;
  }

  async createDoctors(data: DoctorProfile) {
    const {
      userId,
      specialization,
      experienceYears,
      ratings,
      bio,
      isOnline,
      availability,
    } = data;

    const newDoctor = await prisma.doctor.create({
      data: {
        userId,
        specialization,
        experienceYears, // Years of experience
        ratings, // Example rating
        bio,
        isOnline, // Profile picture URL
        availability,
      },
    });

    return newDoctor;
  }

  async getTopDoctors() {
    const doctors = await prisma.doctor.findMany({
      orderBy: { ratings: "desc" },
      take: 5,
    });

    return doctors;
  }

  async findDoctors(filters: FilterDoctor): Promise<Doctor[]> {
    return prisma.doctor.findMany({
      where: {
        specialization: filters.specialization,
        ratings: { gte: filters.minRating },
        location: { contains: filters.location },
        consultationTypes: { has: filters.consultationType },
        availability: {
          equals: filters.availability,
        },
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
