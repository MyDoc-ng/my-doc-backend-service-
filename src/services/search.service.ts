import { prisma } from "../prisma/prisma";

export class SearchService {
  async searchKeyWords(keyword: string) {
    
    const doctors = await prisma.doctor.findMany({
      where: {
        name: {
          search: keyword,
        }
      },
    });
      // Dummy drugs data (Replace with a real drug model if you have one)
      const drugs = [
        { id: "101", name: "Paracetamol", price: "500", description: "Pain reliever" },
      ].filter((drug) => drug.name.toLowerCase().includes(keyword.toLowerCase()));

      
    return {
      doctors,
      drugs
    };
  }
}
