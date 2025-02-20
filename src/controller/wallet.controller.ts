// src/controllers/booking.controller.ts
import { NextFunction, Request, Response } from "express";
import { WalletService } from "../services/wallet.service";

const walletService = new WalletService();


export class WalletController {

  async topUpWallet(req: Request, res: Response, next: NextFunction):Promise<any> {
   try {
      const transaction = await walletService.topUpWallet(
        req.body.userId,
        req.body.amount,
        req.body.promoCode
      );
      res.json(transaction);
    } catch (error) {
        next(error)
    }
  }

 
}
