import { PrismaClient } from '@prisma/client';

class PrismaSingleton {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!PrismaSingleton.instance) {
      // @ts-ignore
      PrismaSingleton.instance = new PrismaClient({
        omit: {
          user: {
            password: true,
          }
        },
        errorFormat: "minimal"
      });
    }
    return PrismaSingleton.instance;
  }
}

export const prisma = PrismaSingleton.getInstance();
