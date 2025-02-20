import { NextFunction, Request, Response } from "express";
import { DoctorService } from "../services/doctor.service";

const doctorService = new DoctorService();

export class DoctorController {
  async getDoctors(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const users = await doctorService.getDoctors();

      res.json(users);
    } catch (error: any) {
      next(error);
    }
  }

  async getTopDoctors(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const doctors = await doctorService.getTopDoctors();

      res.json(doctors);
    } catch (error: any) {
      next(error);
    }
  }
}
