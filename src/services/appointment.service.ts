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

    // const newDoctor = await prisma.doctor.create({
    //   data: {
    //     userId: "62644d88-9368-4272-8341-bea505b1cb01",
    //     specialization: "Optician",
    //     experienceYears: 15, // Years of experience
    //     ratings: 4.0, // Example rating
    //     bio: "Experienced optician with a passion for eyes health.",
    //     isOnline: true, // Profile picture URL
    //     availability: [
    //       {
    //         day: "Monday",
    //         slots: [
    //           { start: "08:00", end: "12:00" },
    //           { start: "14:00", end: "18:00" },
    //         ],
    //       },
    //       {
    //         day: "Tuesday",
    //         slots: [
    //           { start: "09:00", end: "11:00" },
    //           { start: "15:00", end: "17:00" },
    //         ],
    //       },
    //       {
    //         day: "Wednesday",
    //         slots: [{ start: "10:00", end: "14:00" }],
    //       },
    //       {
    //         day: "Thursday",
    //         slots: [
    //           { start: "08:30", end: "12:30" },
    //           { start: "13:30", end: "16:30" },
    //         ],
    //       },
    //       {
    //         day: "Friday",
    //         slots: [
    //           { start: "07:00", end: "11:00" },
    //           { start: "13:00", end: "15:00" },
    //         ],
    //       },
    //       {
    //         day: "Saturday",
    //         slots: [{ start: "09:00", end: "12:00" }],
    //       },
    //       {
    //         day: "Sunday",
    //         slots: [],
    //       },
    //     ],
    //   },
    // });

    // console.log("Doctor created:", newDoctor);

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
