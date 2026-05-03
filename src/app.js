import dotenv from "dotenv";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { errorHandler } from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();

app.use(express.json());

if (process.env.ENABLE_TEST_RESET === "true") {
  app.use("/__test__", testRoutes);
}

app.use("/auth", authRoutes);
app.use("/jobs", jobRoutes);
app.use("/applications", applicationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
