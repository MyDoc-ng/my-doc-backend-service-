import express from "express";
import type { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//Handling not existing routes

app.use((_req: Request, res: Response, _next: NextFunction) => {
  res.status(404).send("Route not found")
});

//Initialize the server
app.listen(3000, () => {
  console.log(`[server]: server is running at 
  http://localhost:3000/api`);
});