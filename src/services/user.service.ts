import { AppointmentStatus, UserTypes } from "@prisma/client";
import { ErrorCode } from "../exception/base";
import { NotFoundException } from "../exception/not-found";
import { prisma } from "../prisma/prisma";
import { ChatMessageData } from "../models/chatMessage.model";
import { checkIfUserExists } from "../utils/checkIfUserExists";
import { UpdateProfileData } from "../models/auth.model";

export class UserService {

  static async getUsers() {
    const users = await prisma.user.findMany({ where: { role: UserTypes.PATIENT } });
    return users;
  }

  static async getUserById(id: string) {
    return await prisma.user.findUnique({ where: { id } });
  }

  static async getUpcomingConsultations(userId: string) {

    const userExists = await checkIfUserExists(userId);
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

    const senderExists = await checkIfUserExists(data.senderId);
    if (!senderExists) {
      throw new NotFoundException("Sender not found", ErrorCode.NOTFOUND);
    }

    // Check if receiver exists
    const receiverExists = await checkIfUserExists(data.receiverId);
    if (!receiverExists) {
      throw new NotFoundException("Receiver not found", ErrorCode.NOTFOUND);
    }

    // Save message in database
    return await prisma.chatMessage.create({
      data: data,
    });

  }

  static async getMessages(userId: string) {

    const userExists = await checkIfUserExists(userId);
    if (!userExists) {
      throw new NotFoundException("User not found", ErrorCode.NOTFOUND);
    }

    return await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

  }

  static async updateProfile(profileData: UpdateProfileData): Promise<any> {
    const {
      userId,
      dateOfBirth,
      gender,
      phoneNumber,
      name,
      email
    } = profileData;

    const userExists = await checkIfUserExists(userId);

    if (!userExists) {
      throw new NotFoundException("User not found", ErrorCode.NOTFOUND);
    }

    const result = await prisma.$transaction(async (tx) => {
      let user = await tx.user.update({
        where: { id: userId },
        data: {
          name: name,
          email: email,
        },
        include: { patientProfile: true }
      });

      // Update profile picture in the PatientProfile table
      await tx.patientProfile.updateMany({
        where: { userId: user.id },
        data: {
          dateOfBirth: new Date(dateOfBirth),
          gender: gender,
          phoneNumber: phoneNumber
        },
      });

      return { user };
    });

    return {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      gender: result.user.patientProfile?.gender,
      dateOfBirth: result.user.patientProfile?.dateOfBirth,
      phoneNumber: result.user.patientProfile?.phoneNumber,
      createdAt: result.user.createdAt,
    };
  }

}
