
export type GOPDBookingData = {
  doctorId: string;
  patientId: string;
};

export type BookingData = {
  doctorId: string;
  patientId: string;
  date: Date;
  time: string;
};

export type UpdateBookingData = {
  appointmentId: string;
  date: Date;
  time: string;
};
