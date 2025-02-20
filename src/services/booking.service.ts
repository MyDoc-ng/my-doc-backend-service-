// src/services/booking.service.ts
import { Session, Profile, ConsultationType, TransactionType } from "@prisma/client";
import { prisma } from "../prisma/prisma";
import { BadRequestException } from "../exception/bad-request";
import { ErrorCode } from "../exception/base";

export class BookingService {
  async createSession(
    userId: string,
    doctorId: string,
    type: ConsultationType,
    symptoms?: string,
    profileId?: string
  ): Promise<Session> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    const requiredBalance = type === ConsultationType.MESSAGING ? 4000 : 10500;

    if (!user?.wallet || user.wallet.balance < requiredBalance) {
      throw new BadRequestException(
        `Insufficient balance. Minimum required: ${requiredBalance}`,
        ErrorCode.BADREQUEST
      );
    }

    return prisma.$transaction(async (tx) => {
      // Create session
      const session = await tx.session.create({
        data: {
          type,
          startTime: new Date(),
          userId,
          doctorId,
          profileId,
          symptoms,
        },
      });

      // Deduct funds
      await tx.wallet.update({
        where: { id: String(user.walletId) },
        data: { balance: { decrement: requiredBalance } },
      });

      // Record transaction
      await tx.transaction.create({
        data: {
          amount: -requiredBalance,
          type: TransactionType.CONSULTATION,
          userId,
        },
      });

      return session;
    });
  }

  async createProfile(
    userId: string,
    data: { fullName: string; contact: string; gender: string; age: number }
  ): Promise<Profile> {
    return prisma.profile.create({
      data: {
        ...data,
        userId,
      },
    });
  }
}
