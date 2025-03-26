import { AppointmentStatus, UserTypes } from "@prisma/client";
import { ErrorCode } from "../exception/base";
import { NotFoundException } from "../exception/not-found";
import { prisma } from "../prisma/prisma";
import { ChatMessageData } from "../models/chatMessage.model";
import { checkIfUserExists } from "../utils/checkIfUserExists";

export class UserService {

  static async getUsers() {
    const users = await prisma.user.findMany();
    return users;
  }

  static async getUserById(id: string) {
    return await prisma.user.findUnique({ where: { id } });
  }

  static async getUpcomingConsultations(userId: string) {

    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userExists) {
      throw new NotFoundException("User not found", ErrorCode.NOTFOUND);
    }

    return await prisma.consultation.findMany({
      where: {
        patientId: userId,
        status: AppointmentStatus.UPCOMING
      },
      orderBy: {
        startTime: 'asc'
      },
      include: {
        patient: true,
        doctor: true,
      },
    });
  }

  static async sendMessage(data: ChatMessageData) {

    const senderExists = await checkIfUserExists(data.senderId, data.senderType);
    if (!senderExists) {
      throw new NotFoundException("Sender not found", ErrorCode.NOTFOUND);
    }

    // Check if receiver exists
    const receiverExists = await checkIfUserExists(data.receiverId, data.receiverType);
    if (!receiverExists) {
      throw new NotFoundException("Receiver not found", ErrorCode.NOTFOUND);
    }

    // Save message in database
    return await prisma.chatMessage.create({
      data: data,
    });

  }

  static async getUserMessages(userId: string) {

    const userExists = await checkIfUserExists(userId, UserTypes.USER);
    if (!userExists) {
      throw new NotFoundException("User not found", ErrorCode.NOTFOUND);
    }

    return await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: userId, senderType: UserTypes.USER },
          { receiverId: userId, receiverType: UserTypes.USER },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

  }

}
