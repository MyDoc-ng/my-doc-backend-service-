import { NextFunction, Request, Response } from "express";
import { BankService } from "../service/bank.service";

export class BankController {
  static async addBankAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const result = await BankService.addBankAccount(userId, req.body);

      res.status(result.status ?? 201).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  static async getBankAccount(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const bankAccount = await BankService.getBankAccount(userId);
      return res.status(200).json({
        status: "success",
        data: bankAccount,
      });
    } catch (error: any) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  }

  static async updateBankAccount(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const bankAccount = await BankService.updateBankAccount(userId, req.body);
      return res.status(200).json({
        status: "success",
        message: "Bank account updated successfully",
        data: bankAccount,
      });
    } catch (error: any) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  }

  static async deleteBankAccount(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      await BankService.deleteBankAccount(userId);
      return res.status(200).json({
        status: "success",
        message: "Bank account deleted successfully",
      });
    } catch (error: any) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  }
}
