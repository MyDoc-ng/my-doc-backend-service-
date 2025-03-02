import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes"; 
import userRoutes from "./routes/user.routes";
import doctorRoutes from "./routes/doctor.routes";
import appointments from "./routes/appointment.routes";
import searchRoutes from "./routes/search.routes";
import { errorMiddleware } from "./middleware/errorMiddleware";
import { NotFoundException } from "./exception/not-found";
import { ErrorCode } from "./exception/base";
import responseFormatter from "./middleware/responseFormatter";

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

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/', userRoutes);
app.use('/api/', doctorRoutes);
app.use('/api/', appointments);
app.use('/api/', searchRoutes);


// Handle non-existing routes
app.use((_req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundException(`Route ${_req.url} not found`, ErrorCode.NOTFOUND));
});

app.use(errorMiddleware);

// Initialize the server
app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
