import { SessionType, Doctor, Prisma } from "@prisma/client";
import { prisma } from "../prisma/prisma";
import { NotFoundException } from "../exception/not-found";
import { ErrorCode } from "../exception/base";

interface FilterDoctor {
  specialization?: string;
  minRating?: number;
  location?: string;
  availability?: string;
  consultationType?: SessionType;
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
  name: string;
  email: string;
  experience: number;
  location: string;
  consultationTypes: SessionType[]; // Assuming consultation types are strings
  consultationFees: number;
  homeVisitCharge: number;
  videoConsultationFee: number;
  clinicConsultationFee: number;
  ratings: number;
  bio: string;
  specialtyId: string;
}


export class DoctorService {

  static async getAllDoctors() {
    return await prisma.doctor.findMany();
  }

  static async getDoctorById(doctorId: string) {
    return await prisma.doctor.findUnique({
      where: { id: doctorId },
    });
  }


  static async createDoctors(data: DoctorProfile) {
    const {
      name,
      email,
      experience,
      location,
      consultationTypes,
      consultationFees,
      homeVisitCharge,
      videoConsultationFee,
      clinicConsultationFee,
      ratings,
      bio,
      specialtyId,
    } = data;

    const existingDoctor = await prisma.doctor.findFirst({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    if (existingDoctor) {
      throw new Error('Doctor with this email already exists');
    }

    const newDoctor = await prisma.doctor.create({
      data: {
        name,
        email,
        consultationTypes,
        location,
        consultationFees,
        homeVisitCharge,
        videoConsultationFee,
        clinicConsultationFee,
        experience,
        ratings,
        bio,
        specialtyId,
      },
    });

    return newDoctor;
  }

  static async getTopDoctors() {
    const doctors = await prisma.doctor.findMany({
      orderBy: { ratings: "desc" },
      take: 5,
    });

    return doctors;
  }

  static async findDoctors(filters: FilterDoctor): Promise<Doctor[]> {
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

  static async getDoctorAvailability(
    doctorId: string
  ): Promise<Availability[]> {
    const doctor = await prisma.doctor.findUnique({ 
      where: { id: doctorId },
      select: { availability: true }
    });
    
    if (!doctor) {
      throw new NotFoundException("Doctor not found", ErrorCode.NOTFOUND);
    }

    try {
      return JSON.parse(doctor.availability as string) as Availability[];
    } catch {
      return [];
    }
  }
}
