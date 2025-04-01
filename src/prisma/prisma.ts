import { PrismaClient, Prisma } from '@prisma/client';

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

      const SOFT_DELETE_MODELS = ["User"]; // Add models manually

      // 🛠️ Add Middleware for Soft Delete Handling
      PrismaSingleton.instance.$use(async (params, next) => {
        if (SOFT_DELETE_MODELS.includes(params.model || "")) {
          // Auto-exclude soft deleted records for `find` queries
          if (["findFirst", "findMany", "findUnique"].includes(params.action)) {
            if (!params.args.where) params.args.where = {};
            params.args.where.deletedAt = null; // Ensure only non-deleted records are retrieved
          }

          // Soft delete instead of hard delete
          if (params.action === "delete") {
            params.action = "update";
            params.args.data = { deletedAt: new Date() };
          }

          // Soft delete when using `deleteMany`
          if (params.action === "deleteMany") {
            params.action = "updateMany";
            params.args.data = { deletedAt: new Date() };
          }
        }
        return next(params);
      });
    }

    return PrismaSingleton.instance;
  }
}

export const prisma = PrismaSingleton.getInstance();
