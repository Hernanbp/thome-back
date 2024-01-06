import InitFirebase from "./config/db/init-firebase";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { User } from "./types/types";

async function findUserByEmail(email?: string): Promise<any> {
  try {
    const db = await InitFirebase().firestore();
    const docRef = db.collection("users").where("email", "==", email);
    const user = await docRef.get();

    return user;
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw error;
  }
}

async function createUser(email: string) {
  const db = await InitFirebase().firestore();
  const userId = uuidv4();
  await db
    .collection("users")
    .doc(userId)
    .set({
      id: userId,
      email: email,
      roles: ["USER"],
      status: "PENDING",
    });
}

async function loginGoogle(email?: string) {
  const db = await InitFirebase().firestore();
  const snapshot = await db.collection("users").where("email", "==", email);
  const user = await snapshot.get();
  const userData = user.docs[0].data() as User;

  let { id, roles, status } = userData;

  const accessToken = jwt.sign(
    { id, roles, status },
    process.env.ACCESS_TOKEN_SECRET as string,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
    }
  );

  return { accessToken };
}

export { findUserByEmail, createUser, loginGoogle };
