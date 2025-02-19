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
    //     name: "Dr. John Doe",
    //     specialty: "Cardiology",
    //     experience: 10, // Years of experience
    //     ratings: 4.8, // Example rating
    //     bio: "Experienced cardiologist with a passion for heart health.",
    //     profilePic: "https://example.com/profile.jpg", // Profile picture URL
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
      appointment: newAppointment
    }
  }

  async getUpcomingAppointment() {
   const upcomingAppointment = await prisma.appointment.findUnique({});
  }
    
}
