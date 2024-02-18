import { Router } from "express";
import { verifyJwt } from "../middlewares/verifyJwt";
import { googleMiddleware } from "../middlewares/googleMiddleware";
import {
  deleteUser,
  getAllUsers,
  getOwnerById,
  getUserByToken,
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

router.get("/test", (req, res) => {
  return res.status(200).send("todo ok");
});
router.post("/googleLogin", googleMiddleware, googleLogin);
router.get("/getAllUsers", verifyJwt, hasRole, getAllUsers);
router.get("/getUserByToken", verifyJwt, getUserByToken);
router.get("/getOwnerById/:id", getOwnerById);
router.patch("/update", verifyJwt, updateUser);
router.delete("/delete", verifyJwt, deleteUser);

export { router };
