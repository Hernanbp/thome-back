import { Router } from "express";
import {
  deleteProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  createProperty,
  getPropertiesByOwner,
} from "../controllers/property";
import { verifyJwt } from "../middlewares/verifyJwt";

const router = Router();

router.post("/createProperty", verifyJwt, createProperty);
router.get("/getAllProperties", getAllProperties);
router.get("/getPropertyById/:id", getPropertyById);

//TODO: get prop by owner
router.get("/getPropertiesByOwner", verifyJwt, getPropertiesByOwner);

router.patch("/updateProperty/:id", updateProperty);
router.delete("/delete/:id", deleteProperty);

export { router };
