import { prisma } from "../prisma/prisma";
import { responseService } from "../services/response.service";

export class BankService {
  static async addBankAccount(
    userId: string,
    bankData: {
      bankName: string;
      accountNo: string;
      accountName: string;
    }
  ) {
    // Check if user already has a bank account
    const existingAccount = await prisma.bankAccount.findFirst({
      where: { userId },
    });

    if (existingAccount) {
      return responseService.error({
        message: "User already has a bank account",
      });
    }
    // Create new bank account
    const bankAccount = await prisma.bankAccount.upsert({
      where: { userId },
      update: {
        ...bankData,
      },
      create: {
        userId,
        ...bankData,
      },
    });    

    return responseService.success({
      message: "Bank account added successfully",
      data: bankAccount,
      status: 201,
    });
  }

  static async getBankAccount(userId: string) {
    const bankAccount = await prisma.bankAccount.findFirst({
      where: { userId },
    });

    if (!bankAccount) {
      return responseService.notFoundError({
        message: "Bank account not found",
      });
    }

    return responseService.success({
      message: "Bank Account fetched Successfully",
      data: bankAccount,
    });
  }

  static async updateBankAccount(
    userId: string,
    bankData: Partial<{
      bankName: string;
      accountNumber: string;
      accountName: string;
    }>
  ) {
    const existingAccount = await prisma.bankAccount.findFirst({
      where: { userId },
    });

    if (!existingAccount) {
      throw new Error("Bank account not found");
    }

    return await prisma.bankAccount.update({
      where: { id: existingAccount.id },
      data: bankData,
    });
  }

  static async deleteBankAccount(userId: string) {
    const existingAccount = await prisma.bankAccount.findFirst({
      where: { userId },
    });

    if (!existingAccount) {
      throw new Error("Bank account not found");
    }

    await prisma.bankAccount.delete({
      where: { id: existingAccount.id },
    });
  }
}
