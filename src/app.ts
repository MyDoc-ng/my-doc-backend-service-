import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes"; 
import userRoutes from "./routes/userRoutes";
import { errorMiddleware } from "./middleware/errorMiddleware";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const PORT: number = parseInt(process.env.PORT || "3000", 10);

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/', userRoutes);


// Handle non-existing routes
app.use((_req: Request, res: Response, _next: NextFunction) => {
  res.status(404).send("Route not found");
});

app.use(errorMiddleware);

// Initialize the server
app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
