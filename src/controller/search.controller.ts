import { NextFunction, Request, Response } from "express";
import { SearchService } from "../services/search.service";

const searchService = new SearchService();


export class SearchController{
    static async search(req: Request, res: Response, next: NextFunction): Promise<void> {

        const query = req.query.keyword as string;
        
        try {
           const results = await searchService.searchKeyWords(query); 

           res.status(200).json(results);

        } catch (error) {
            next(error)
        }
    }
}