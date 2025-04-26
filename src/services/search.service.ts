import { AppointmentStatus, UserTypes } from "@prisma/client";
import { prisma } from "../prisma/prisma";
import { responseService } from "./response.service";

export class SearchService {
  async searchKeyWords(keyword: string) {
    const [doctors, specialties] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            {
              name: {
                contains: keyword,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: keyword,
                mode: "insensitive",
              },
            },
          ],
        },
      }),

      prisma.specialty.findMany({
        where: {
          name: {
            contains: keyword,
            mode: "insensitive",
          },
        },
      }),
    ]);

    return responseService.success({
      message: "Search results fetched successfully",
      data: {
        doctors,
        specialties,
      },
    });
  }

  static async searchDoctors(doctorId: string, keyword: string) {
    const [doctors, consultations] = await Promise.all([
      // 1. Search doctors
      prisma.user.findMany({
        where: {
          roles: {
            some: {
              role: {
                name: UserTypes.DOCTOR,
              },
            },
          },
          OR: [
            { name: { contains: keyword, mode: "insensitive" } },
            { email: { contains: keyword, mode: "insensitive" } },
            {
              doctorProfile: {
                OR: [
                  {
                    specialty: {
                      name: { contains: keyword, mode: "insensitive" },
                    },
                  },
                ],
              },
            },
          ],
        },
        include: {
          doctorConsultations: {
            select: {
              id: true,
              status: true,
              patientId: true,
            },
          },
        },
      }),

      // 2. Search patients linked to logged-in doctor
      prisma.consultation.findMany({
        where: {
          doctorId: doctorId,
          patient: {
            OR: [
              { name: { contains: keyword, mode: "insensitive" } },
              { email: { contains: keyword, mode: "insensitive" } },
              { phoneNumber: { contains: keyword, mode: "insensitive" } },
            ],
          },
        },
        include: {
          patient: true,
        },
      }),
    ]);

    // Extract only unique patients
    const patients = consultations.map((consultation) => consultation.patient);

    return responseService.success({
      message: "Search results fetched successfully",
      data: {
        doctors,
        patients,
      },
    });
  }
}
