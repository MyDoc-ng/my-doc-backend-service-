import { prisma } from "../prisma/prisma";

interface AppointmentData {
  type: "Urgent" | "NonUrgent";
  patientName: string;
  patientEmail: string;
  symptoms: [string];
  consultationType: "Messaging" | "AudioCall" | "VideoCall";
  doctorId: string;
  date: string;
  time: string;
}

export class AppointmentService {
  async getAppointments() {
    const appointments = await prisma.appointment.findMany();
    return appointments;
  }

  async createAppointment(appointmentData: AppointmentData) {
    const {
      type,
      patientName,
      patientEmail,
      symptoms,
      consultationType,
      doctorId,
      date,
      time,
    } = appointmentData;

    // Create appointment
    const newAppointment = await prisma.appointment.create({
      data: {
        type,
        patientName,
        patientEmail,
        symptoms,
        consultationType,
        doctorId,
        date,
        time,
      },
    });

    return {
      appointment: newAppointment,
    };
  }

  async getUpcomingAppointment(userId: string) {
    const upcomingAppointment = await prisma.appointment.findFirst({
      where: {
        patientEmail: userId,
      },
      orderBy: [
        { date: "asc" }, // Order by nearest date
        { time: "asc" }, // If same date, order by nearest time
      ],
      include: {
        doctor: true,
      },
    });

    return upcomingAppointment;
  }
}
