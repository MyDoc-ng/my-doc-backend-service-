// src/services/wallet.service.ts
import { Transaction } from "@prisma/client";
import { prisma } from "../prisma/prisma";

export class WalletService {
  async topUpWallet(
    userId: string,
    amount: number,
    promoCode?: string
  ): Promise<Transaction> {
    return prisma.$transaction(async (tx) => {
      // Apply promo code logic
      const discount = promoCode ? await this.applyPromoCode(promoCode) : 0;
      const finalAmount = amount - discount;

      // Update wallet
      await tx.wallet.update({
        where: { userId },
        data: { balance: { increment: finalAmount } },
      });

      // Create transaction
      return tx.transaction.create({
        data: {
          amount: finalAmount,
          type: "TOP_UP",
          promoCode,
          userId,
        },
      });
    });
  }

  private async applyPromoCode(code: string): Promise<number> {
    // Implement promo code validation and discount calculation
    return 0; // Example implementation
  }
}
