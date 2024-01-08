import { Router } from "express";
import {
  deleteProperty,
  getProperties,
  getProperty,
  updateProperty,
  upload,
} from "../controllers/property";

const router = Router();

router.post("/upload", upload);
router.get("/", getProperties);
router.get("/:id", getProperty);
router.patch("/update/:id", updateProperty);
router.delete("/delete/:id", deleteProperty);

export { router };
