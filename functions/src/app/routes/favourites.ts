import { Router } from "express";
import { createFavourite } from "../controllers/favoruites";
import { verifyJwt } from "../middlewares/verifyJwt";

const router = Router();

router.post("/createFavourite", verifyJwt, createFavourite);

export { router };
