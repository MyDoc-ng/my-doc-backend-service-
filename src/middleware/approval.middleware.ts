import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/prisma";
import { ApprovalStatus } from "@prisma/client";
import { BadRequestException } from "../exception/bad-request";

export async function approvalMiddleware(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const userId = req.user?.id; 

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        approvalStatus: true
      }
    });

    if (!user) {
        throw new BadRequestException("User not found", "USER_NOT_FOUND");
    }

    if (user.approvalStatus!== ApprovalStatus.APPROVED) {
        throw new BadRequestException("User not approved");
    }

    next(); 
  } catch (error) {
    console.error("Approval Middleware Error:", error);
    throw new BadRequestException("Internal server error");
  }
}
