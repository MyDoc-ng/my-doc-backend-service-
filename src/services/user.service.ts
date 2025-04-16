import { AppointmentStatus, UserTypes } from "@prisma/client";
import { ErrorCode } from "../exception/base";
import { NotFoundException } from "../exception/not-found";
import { prisma } from "../prisma/prisma";
import { ChatMessageData } from "../models/chatMessage.model";
import { checkIfUserExists } from "../utils/checkIfUserExists";
import bcrypt from "bcrypt";
import { IChangePassword, IUpdateProfile } from "../models/auth.model";
import { responseService } from "./response.service";

export class UserService {

  static async getUsers() {
    return await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              name: UserTypes.PATIENT  // Assuming Role.name contains the role type
            }
          }
        }
      },
      include: {
        roles: {
          include: {
            role: true // Include full role details if needed
          }
        }
      }
    });
  }

  static async getUserById(id: string) {
    return await prisma.user.findUnique({ where: { id } });
  }

  static async getUpcomingConsultations(userId: string) {

    const userExists = await checkIfUserExists(userId);
    if (!userExists) {
      return responseService.notFoundError({
        message: "User not found",
      })
    }

    const consultation = await prisma.consultation.findMany({
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

    return responseService.success({
      message: "Upcoming consultations fetched successfully",
      data: consultation
    });
  }

  static async getPendingConsultations(userId: string) {

    const userExists = await checkIfUserExists(userId);
    if (!userExists) {
      return responseService.notFoundError({
        message: "User not found",
      })
    }

    const consultation = await prisma.consultation.findMany({
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

    return responseService.success({
      message: "Pending consultations fetched successfully",
      data: consultation
    });
  }

  static async getCancelledConsultations(userId: string) {

    const userExists = await checkIfUserExists(userId);
    if (!userExists) {
      return responseService.notFoundError({
        message: "User not found",
      })
    }

    const consultation = await prisma.consultation.findMany({
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

    return responseService.success({
      message: "Cancelled consultations fetched successfully",
      data: consultation
    });
  }

  static async getCompletedConsultations(userId: string) {

    const userExists = await checkIfUserExists(userId);
    if (!userExists) {
      return responseService.notFoundError({
        message: "User not found",
      })
    }

    const consultation = await prisma.consultation.findMany({
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

    return responseService.success({
      message: "Completed consultations fetched successfully",
      data: consultation
    });
  }

  static async sendMessage(data: ChatMessageData) {

    const senderExists = await checkIfUserExists(data.senderId);
    if (!senderExists) {
      throw new NotFoundException("Sender not found");
    }

    // Check if receiver exists
    const receiverExists = await checkIfUserExists(data.receiverId);
    if (!receiverExists) {
      throw new NotFoundException("Receiver not found");
    }

    // Save message in database
    return await prisma.chatMessage.create({
      data: data,
    });

  }

  static async getMessages(userId: string) {

    const userExists = await checkIfUserExists(userId);
    if (!userExists) {
      throw new NotFoundException("User not found");
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
      return responseService.notFoundError({
        message: "User not found",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      let user = await tx.user.update({
        where: { id: userId },
        data: {
          name: name,
          email: email,
          dateOfBirth: dateOfBirth,
          gender: gender,
          phoneNumber: phoneNumber
        },
        include: { patientProfile: true }
      });

      return { user };
    });

    return responseService.success({
      message: "Profile Updated Successfully",
      data: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        gender: result.user.gender,
        dateOfBirth: result.user.dateOfBirth,
        phoneNumber: result.user.phoneNumber,
        photo: result.user.profilePicture,
        createdAt: result.user.createdAt,
      }
    });
  }

  static async changePassword(passwordData: IChangePassword): Promise<any> {
    const { newPassword, currentPassword, userId } = passwordData;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
    if (!user) {
      return responseService.notFoundError({
        message: "User not found"
      })
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password!);

    if (!isPasswordValid) {
      return responseService.error({
        message: "Current password is incorrect"
      })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return responseService.success({
      message: "Password changed successfully.",
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        photo: updatedUser.profilePicture
      }
    })
  }

  // static async deleteUserById(userId: string): Promise<any> {
  //   const userExists = await prisma.user.findUnique({
  //     where: { id: userId },
  //     select: {
  //       id: true,
  //       createdAt: true,
  //       name: true,
  //       email: true,
  //       password: true,
  //       registrationStep: true,
  //       roles: {
  //         include: { role: true }
  //       },

  //     }
  //   });

  //   if (!userExists) {
  //     return responseService.notFoundError({
  //       message: "User not found",
  //     });
  //   }

  //   return await prisma.$transaction(async (tx) => {
  //     // 1. Archive the user data first
  //     await tx.archivedUser.create({
  //       data: {
  //         id: userExists.id,
  //         email: userExists.email,
  //         name: userExists.name,
  //         password: userExists.password!, // Consider if you really need to store this
  //         archivedAt: new Date(),
  //         archivedReason: 'User requested account deletion',
  //         originalRoles: JSON.stringify(userExists.roles.map(r => ({
  //           roleId: r.roleId,
  //           roleName: r.role.name
  //         }))),
  //         metadata: JSON.stringify({
  //           registrationStep: userExists.registrationStep,
  //           createdAt: userExists.createdAt,
  //         })
  //       }
  //     });

  //     await tx.chatMessage.deleteMany({
  //       where: { senderId: userId }
  //     });

  //     await tx.payment.deleteMany({
  //       where: { OR: [{ patientId: userId }, { doctorId: userId }] }
  //     });

  //     await tx.consultation.deleteMany({
  //       where: { OR: [{ patientId: userId }, { doctorId: userId }] }
  //     });

  //     await tx.user.delete({
  //       where: { id: userId },
  //     });

  //     return responseService.success({
  //       message: "Account deleted successfully.",
  //       data: {}
  //     });
  //   });
  // }

  static async deleteUserAccount(userId: string, reason?: string) {

    try {
    
      return await prisma.$transaction(async (tx) => {
        // Archive the user
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            createdAt: true,
            name: true,
            email: true,
            password: true,
            registrationStep: true,
            roles: {
              include: { role: true }
            },
          }
        });

        if (!user) {
          return responseService.error({
            message: "User not found",
          })
        }

        // Create archive record
        await tx.archivedUser.create({
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            password: user.password!, // Consider if you really need to store this
            archivedAt: new Date(),
            archivedReason: 'User requested account deletion',
            originalRoles: JSON.stringify(user.roles.map(r => ({
              roleId: r.roleId,
              roleName: r.role.name
            }))),
            metadata: JSON.stringify({
              registrationStep: user.registrationStep,
              createdAt: user.createdAt,
            })
          }
        });

        // You need to do this for each table that references users
        await tx.consultation.updateMany({
          where: { patientId: userId },
          data: { dPatientId: userId }
        });

        await tx.chatMessage.updateMany({
          where: { senderId: userId },
          data: { dSenderId: userId }
        });

        await tx.payment.updateMany({
          where: { patientId: userId },
          data: { dPatientId: userId }
        });

        // Delete the original user
        await tx.user.delete({ where: { id: userId } });

        return responseService.success({
          message: "Account deleted successfully.",
          data: {}
        });
      });
    } catch (error) {
      throw error;
    }
  }
}
