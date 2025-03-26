import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { errorMiddleware } from "./middleware/errorMiddleware";
import { NotFoundException } from "./exception/not-found";
import { ErrorCode } from "./exception/base";
import responseFormatter from "./middleware/responseFormatter";
import logger from "./logger";
import { createServer } from "http";
import { setupWebSocket } from "./configs/websocket";

const app = express();
const server = createServer(app); 

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const PORT: number = parseInt(process.env.PORT || "8000", 10);

app.use(responseFormatter);

// Mount all routes
app.use(routes);

// Register endpoint for testing
app.get("/", (req: Request, res: Response) => {
  res.status(200).send("API is working!");
});

// Handle non-existing routes
app.use((_req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundException(`Route ${_req.url} not found`, ErrorCode.NOTFOUND));
});

app.use(errorMiddleware);

// Initialize WebSocket server
setupWebSocket(server); 

// Start the server
server.listen(PORT, () => {
  logger.info(`Server is running at http://localhost:${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV,
  });
});

logger.info("Application routes mounted successfully");
