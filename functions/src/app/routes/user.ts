import { Router } from "express";
import { verifyJwt } from "../middlewares/verifyJwt";
import { googleMiddleware } from "../middlewares/googleMiddleware";
import {
  deleteUser,
  getUser,
  getUsers,
  googleLogin,
  updateUser,
} from "../controllers/user";
import { hasRole } from "../middlewares/hasRole";

const router = Router();

router.get("/protected", verifyJwt, (req, res) => {
  //@ts-ignore
  const decodedToken = req.decoded;
  res.json({ message: "This is a protected route", decodedToken });
});

router.post("/googleLogin", googleMiddleware, googleLogin);
router.get("/", verifyJwt, hasRole, getUsers);
router.get("/getUser", verifyJwt, getUser);
router.patch("/update", verifyJwt, updateUser);
router.delete("/delete", verifyJwt, deleteUser);

export { router };
