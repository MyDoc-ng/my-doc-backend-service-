import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes"; 
import userRoutes from "./routes/authRoutes";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const PORT: number = parseInt(process.env.PORT || "3000", 10);

// Register routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

// Handle non-existing routes
app.use((_req: Request, res: Response, _next: NextFunction) => {
  res.status(404).send("Route not found");
});

// Initialize the server
app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
