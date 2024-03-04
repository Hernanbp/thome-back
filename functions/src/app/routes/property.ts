import { Router } from "express";
import {
  deleteProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  createProperty,
  getPropertiesByOwner,
  all,
} from "../controllers/property";
import { verifyJwt } from "../middlewares/verifyJwt";
import { hasPermission } from "../middlewares/hasPermission";

const router = Router();

router.post(
  "/createProperty",
  verifyJwt,
  hasPermission(["owner"]),
  createProperty
);
router.get("/getAllProperties", getAllProperties);
router.get("/all", all);
router.get("/getPropertyById/:id", getPropertyById);
router.get("/getPropertiesByOwner", verifyJwt, getPropertiesByOwner);
router.patch("/updateProperty/:id", updateProperty);
router.delete("/delete/:id", deleteProperty);

export { router };
