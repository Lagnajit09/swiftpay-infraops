import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to transaction-service!" });
});

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🟢 Transaction service running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});
