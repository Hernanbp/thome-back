import { Router } from "express";
import {
  createProperty,
  deleteProperty,
  getProperties,
  getProperty,
  updateProperty,
  upload,
} from "../controllers/property";

const router = Router();

router.post("/create", createProperty);
router.post("/upload", upload);
router.get("/", getProperties);
router.get("/:id", getProperty);
router.patch("/update/:id", updateProperty);
router.delete("/delete/:id", deleteProperty);

export { router };
