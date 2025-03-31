import { prisma } from "../prisma/prisma";

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
              }
            },
            {
              email: {
                contains: keyword,
                mode: "insensitive",
              }
            }
          ]
        },
      }),

      prisma.specialty.findMany({
        where: {
          name: {
            contains: keyword,
            mode: "insensitive",
          },
        },
      })
    ]);

    return {
      doctors,
      specialties,
    };
  }

}
