import { Router } from "express";
import {
  addFavourite,
  getFavourites,
  removeFavourite,
} from "../controllers/favoruites";
import { verifyJwt } from "../middlewares/verifyJwt";

const router = Router();

router.post("/addFavourite/:id", verifyJwt, addFavourite);
router.delete("/removeFavourite/:id", verifyJwt, removeFavourite);
router.get("/getFavourites", verifyJwt, getFavourites);

export { router };
