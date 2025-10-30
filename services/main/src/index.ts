import express from "express";
import dotenv from "dotenv";
dotenv.config();
const app = express();
import authRouter from "./routes/auth";

app.get("/", (req, res) => {
  res.send("Hello from main!");
});

app.use(express.json());
app.use("/api/auth", authRouter);

app.listen(5000, () => {
  console.log("Main-Server is running on port 5000");
});
