import { Router } from "express";
import { upload } from "../controllers/property";

const router = Router();

router.post("/upload", upload);

router.get("/test", (req, res) => {
  return res.status(200).json({ message: "todo ok en property" });
});

export { router };
