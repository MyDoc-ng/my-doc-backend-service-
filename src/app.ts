import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import routes from './routes';
import { errorMiddleware } from "./middleware/errorMiddleware";
import { NotFoundException } from "./exception/not-found";
import { ErrorCode } from "./exception/base";
import responseFormatter from "./middleware/responseFormatter";
import logger from "./logger";


const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const PORT: number = parseInt(process.env.PORT || "3000", 10);

app.use(responseFormatter);

// app.use((req, res, next) => {
//   if (req.path === "/api/exclude") {
//     return next();
//   }
//   responseFormatter(req, res, next);
// });

// Mount all routes
app.use(routes);

// Handle non-existing routes
app.use((_req: Request, res: Response, next: NextFunction) => {
  next(
    new NotFoundException(`Route ${_req.url} not found`, ErrorCode.NOTFOUND)
  );
});

app.use(errorMiddleware);

// Initialize the server
app.listen(PORT, () => {
  logger.info(`Server is running at http://localhost:${PORT}`, { 
    port: PORT,
    environment: process.env.NODE_ENV 
  });
});

logger.info('Application routes mounted successfully');
