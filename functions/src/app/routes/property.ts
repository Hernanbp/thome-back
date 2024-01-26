import { Router } from "express";
import {
  createProperty,
  deleteProperty,
  getAllProperties,
  getData,
  getPropertyById,
  updateProperty,
  upload,
} from "../controllers/property";

const router = Router();

router.post("/create", createProperty);
router.post("/upload", upload);
router.get("/getAllProperties", getAllProperties);
router.get("/getPropertyById/:id", getPropertyById);
router.patch("/update/:id", updateProperty);
router.delete("/delete/:id", deleteProperty);

router.get("/test", getData);

export { router };
