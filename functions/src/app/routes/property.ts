import { Router } from "express";
import {
  deleteProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  upload,
} from "../controllers/property";

const router = Router();

router.post("/upload", upload);
router.get("/getAllProperties", getAllProperties);
router.get("/getPropertyById/:id", getPropertyById);
router.patch("/update/:id", updateProperty);
router.delete("/delete/:id", deleteProperty);

export { router };
