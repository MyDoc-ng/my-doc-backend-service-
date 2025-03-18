import { SessionType } from "@prisma/client";
import { prisma } from "../prisma/prisma";

interface AppointmentData {
  type: "Urgent" | "NonUrgent";
  patientName: string;
  patientEmail: string;
  symptoms: [string];
  consultationType: SessionType;
  doctorId: string;
  date: string;
  time: string;
}

export class AppointmentService {
  async getAppointments() {
    const appointments = await prisma.consultation.findMany();
    return appointments;
  }

  // async createAppointment(appointmentData: AppointmentData) {
  //   const {
  //     type,
  //     patientName,
  //     patientEmail,
  //     symptoms,
  //     consultationType,
  //     doctorId,
  //     date,
  //     time,
  //   } = appointmentData;

  //   // Create appointment
  //   const newAppointment = await prisma.consultation.create({
  //     data: {
  //       consultationType,
  //       doctorId,
  //       date,
  //       time,
  //     },
  //   });

  //   return {
  //     appointment: newAppointment,
  //   };
  // }

  async getUpcomingAppointment(userId: string) {
    const upcomingAppointment = await prisma.consultation.findFirst({
      where: {
        doctorId: userId,
      },
      orderBy: [
        { startTime: "asc" }, // Order by nearest date
        { endTime: "asc" }, // If same date, order by nearest time
      ],
      include: {
        doctor: true,
      },
    });

    return upcomingAppointment;
  }
}
