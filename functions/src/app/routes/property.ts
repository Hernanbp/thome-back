import { Router } from "express";
import { getProperties, upload } from "../controllers/property";

const router = Router();

router.post("/upload", upload);

router.get("/", getProperties);

export { router };
