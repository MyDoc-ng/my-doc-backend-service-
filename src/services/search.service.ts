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

  static async searchDoctors(keyword: string) {
    const [doctors, patients] = await Promise.all([
      prisma.user.findMany({
        where: {
          roles: {
            some: {
              role: {
                name: UserTypes.DOCTOR,
              },
            },
          },
          doctorConsultations: {
            some: {
              status: {
                in: [
                  AppointmentStatus.COMPLETED,
                  AppointmentStatus.UPCOMING,
                  AppointmentStatus.CONFIRMED,
                ],
              },
            },
          },
          OR: [
            { name: { contains: keyword, mode: "insensitive" } },
            { email: { contains: keyword, mode: "insensitive" } },
            {
              doctorProfile: {
                OR: [
                  { location: { contains: keyword, mode: "insensitive" } },
                  // { consultationTypes: { equals: keyword } },
                  {
                    specialty: {
                      name: { equals: keyword, mode: "insensitive" },
                    },
                  },
                ],
              },
            },
          ],
        },
        include: {
          doctorProfile: {
            include: {
              specialty: true,
            },
          },
          DoctorReviews: true,
          doctorConsultations: {
            select: {
              id: true,
              status: true,
              patientId: true,
            },
          },
        },
      }),

      prisma.consultation.findMany({
        where: {
          OR: [
            { patient: { name: { contains: keyword, mode: "insensitive" } } },
            { patient: { email: { contains: keyword, mode: "insensitive" } } },
            { patient: { phoneNumber: { contains: keyword, mode: "insensitive" } } },
          ],
        },
      }),
    ]);

    return responseService.success({
      message: "Search results fetched successfully",
      data: {
        doctors,
        patients,
      },
    });
  }
}
