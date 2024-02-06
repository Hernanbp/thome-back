import express from "express";
import cors from "cors";
import { router } from "./routes";
import { config } from "dotenv";

config();

const app = express();

app.use(cors({ origin: "*", allowedHeaders: "*" }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(router);

export default app;
