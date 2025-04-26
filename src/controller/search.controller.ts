import { NextFunction, Request, Response } from "express";
import { SearchService } from "../services/search.service";

const searchService = new SearchService();


export class SearchController {
    static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
        const query = req.query.keyword as string;
        try {
            const results = await searchService.searchKeyWords(query);

            res.status(results.status ?? 200).json(results);

        } catch (error) {
            next(error)
        }
    }

    static async searchDoctors(req: Request, res: Response, next: NextFunction) {
        try {
          const query = req.query.keyword as string;
          const doctorId = req.user.id;

          const results = await SearchService.searchDoctors(doctorId, query);
    
          res.status(200).json(results);
        } catch (error: any) {
          next(error);
        }
      }
}