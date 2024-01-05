import { Request, Response, Router } from "express";
import { verifyJwt } from "../middlewares/verifyJwt";
import { deleteUser, getUser, getUsers, updateUser } from "../controllers/user";
import { hasRole } from "../middlewares/hasRole";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { User } from "../types/types";
import InitFirebase from "../config/db/init-firebase";

const router = Router();

router.post("/token", async (req: Request, res: Response) => {
  try {
    // Extract credentials from the request body
    const { id = uuidv4(), email, roles } = req.body;

    // Validate credentials
    const isValidCredentials = await findUserByEmail(email);

    if (isValidCredentials) {
      // Generate a JWT token
      const secretKey = process.env.ACCESS_TOKEN_SECRET as string; // Replace with your actual secret key

      const user: User = {
        id,
        email: email, // Replace with the actual email
        name: "John", // Replace with the actual name
        surname: "Doe", // Replace with the actual surname
        registrationNumber: 123, // Replace with the actual registration number
        phoneNumber: 987654321, // Replace with the actual phone number
        address: "123 Main St", // Replace with the actual address
        roles: roles || [], // Default to an empty array if roles are not provided
        status: "COMPLETED", // Replace with the actual status
      };

      const token = jwt.sign(
        {
          status: user.status,
          email: user.email,
          roles: user.roles,
        },
        secretKey,
        {
          expiresIn: "1h",
        }
      );

      // Send the token as a response
      res.json({ token });
    } else {
      // Return an error if credentials are invalid
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error generating token:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Function to find a user by email in the Firebase database
async function findUserByEmail(email: string): Promise<boolean> {
  try {
    const db = await InitFirebase().firestore();
    const docRef = db.collection("users").where("email", "==", email);
    const user = await docRef.get();

    return !user.empty; // Return true if user is found, false otherwise
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw error;
  }
}

router.get("/protected", verifyJwt, (req, res) => {
  //@ts-ignore
  const decodedToken = req.decoded;
  res.json({ message: "This is a protected route", decodedToken });
});

router.get("/", verifyJwt, hasRole, getUsers);
router.get("/getUser", verifyJwt, getUser);
router.patch("/update", verifyJwt, updateUser);
router.delete("/delete", verifyJwt, deleteUser);

export { router };
