import { AppointmentStatus, UserTypes } from "@prisma/client";
import { ErrorCode } from "../exception/base";
import { NotFoundException } from "../exception/not-found";
import { prisma } from "../prisma/prisma";
import { ChatMessageData } from "../models/chatMessage.model";
import { checkIfUserExists } from "../utils/checkIfUserExists";
import bcrypt from "bcrypt";
import { IChangePassword, IUpdateProfile } from "../models/auth.model";
import { BadRequestException } from "../exception/bad-request";

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
        status: AppointmentStatus.CONFIRMED
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

  static async getPendingConsultations(userId: string) {

    const userExists = await checkIfUserExists(userId);
    if (!userExists) {
      throw new NotFoundException("User not found", ErrorCode.NOTFOUND);
    }

    return await prisma.consultation.findMany({
      where: {
        patientId: userId,
        status: AppointmentStatus.PENDING
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

  static async getCancelledConsultations(userId: string) {

    const userExists = await checkIfUserExists(userId);
    if (!userExists) {
      throw new NotFoundException("User not found", ErrorCode.NOTFOUND);
    }

    return await prisma.consultation.findMany({
      where: {
        patientId: userId,
        status: AppointmentStatus.CANCELLED
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

  static async getCompletedConsultations(userId: string) {

    const userExists = await checkIfUserExists(userId);
    if (!userExists) {
      throw new NotFoundException("User not found", ErrorCode.NOTFOUND);
    }

    return await prisma.consultation.findMany({
      where: {
        patientId: userId,
        status: AppointmentStatus.COMPLETED
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

  static async updateProfile(profileData: IUpdateProfile): Promise<any> {
    const { userId, dateOfBirth, gender, phoneNumber, name, email } = profileData;

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

  static async changePassword(passwordData: IChangePassword): Promise<any> {
    const { newPassword, currentPassword, userId } = passwordData;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
    if (!user) {
      throw new NotFoundException("User not found", ErrorCode.NOTFOUND);
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password!);

    if (!isPasswordValid) {
      throw new BadRequestException("Current password is incorrect", ErrorCode.UNAUTHORIZED);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    return await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  static async deleteUserById(userId: string): Promise<void> {
    await prisma.user.delete({
      where: { id: userId },
    });
  }
}
