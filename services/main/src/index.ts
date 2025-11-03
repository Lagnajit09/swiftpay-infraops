import express from "express";
import dotenv from "dotenv";
dotenv.config();
const app = express();
import authRouter from "./routes/auth";
import userRouter from "./routes/user";

app.get("/", (req, res) => {
  res.send("Hello from main!");
});

app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

app.listen(5000, () => {
  console.log(`🟢 Main service running on port ${5000}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔒 CORS enabled for: ${process.env.FRONTEND_URL}`);
});
