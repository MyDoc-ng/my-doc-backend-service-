import { NextFunction, Request, Response } from "express";
import { AppointmentService } from "../services/appointment.service";
import { Prisma } from "@prisma/client";

const appointmentService = new AppointmentService();

export class AppointmentController {
  async getAppointments(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const appointments = await appointmentService.getAppointments();

      res.json(appointments);
    } catch (error: any) {
      next(error);
    }
  }

  // async createAppointment(
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ): Promise<void> {
  //   try {
  //     const appointments = await AppointmentService.createAppointment(req.body);

  //     res.json(appointments);
  //   } catch (error: any) {
  //     next(error);
  //   }
  // }

  async getUpcomingAppointment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const userId = req.query.userId as string;

    try {
      const upcomingAppointments = await appointmentService.getUpcomingAppointment(userId);

      res.json(upcomingAppointments);
    } catch (error: any) {
      next(error);
    }
  }
}
