import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import { InitFirebase } from "../config/db/init-firebase";
import { User } from "../types/types";
import { createUser, loginGoogle } from "../helpers";

interface CustomRequest extends Request {
  payload?: {
    email?: string;
  };
  email?: string;
}

const googleLogin = async (req: CustomRequest, res: Response) => {
  if (req.payload) {
    req.email = req.payload["email"];

    const db = await InitFirebase().firestore();
    const snapshot = await db
      .collection("users")
      .where("email", "==", req.email)
      .get();

    if (snapshot.empty) {
      const email = req.email ?? "";
      if (email) {
        await createUser(email);
      }
    }
  }
  const token = await loginGoogle(req.email);
  return res.status(200).json(token);
};

const getAllUsers = async (req: Request, res: Response) => {
  try {
    const db = await InitFirebase().firestore();
    const snapshot = await db.collection("users").get();

    const users: any = [];
    await Promise.all(
      snapshot.docs.map(async (doc) => {
        const userData = doc.data();
        userData.id = doc.id;
        users.push(userData);
      })
    );
    return res.status(200).send(users);
  } catch (error) {
    return handleHttp(res, "ERROR_GET_USERS");
  }
};

const getUserByToken = async (req: Request, res: Response) => {
  try {
    const db = await InitFirebase().firestore();
    //@ts-ignore
    const userId: string = (req as any).decoded?.id;
    const document = await db.collection("users").doc(userId);
    let user = await document.get();

    if (!user.exists) {
      return res.status(404).send(`User not found`);
    }

    let response = { id: user.id, ...user.data() };

    return res.status(200).send(response);
  } catch (error) {
    return handleHttp(res, "ERROR_GET_USER");
  }
};

const updateUser = async (req: Request, res: Response) => {
  try {
    const db = await InitFirebase().firestore();
    const userId: string = (req as any).decoded?.id;
    const updateUser = await db.collection("users").doc(userId);

    const updatedUserFields: Partial<User> = {
      email: req.body.email,
      name: req.body.name,
      surname: req.body.surname,
      registrationNumber: req.body.registrationNumber,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
    };

    // Remove properties with undefined values to avoid overwriting with undefined
    Object.keys(updatedUserFields).forEach(
      (key) =>
        //@ts-ignore
        updatedUserFields[key] === undefined && delete updatedUserFields[key]
    );

    const existingUserSnapshot = await updateUser.get();
    const existingUserData = existingUserSnapshot.data() as User;

    // Check if name, surname, and phoneNumber are present in the request or already in the document
    if (
      (req.body.name && req.body.surname && req.body.phoneNumber) ||
      (existingUserData &&
        existingUserData.name &&
        existingUserData.surname &&
        existingUserData.phoneNumber)
    ) {
      updatedUserFields.status = "COMPLETED";
    } else {
      updatedUserFields.status = "PENDING";
    }

    await updateUser.update(updatedUserFields);

    const updatedUserSnapshot = await updateUser.get();
    const updatedUser = updatedUserSnapshot.data() as User;

    return res.status(200).send(updatedUser);
  } catch (error) {
    return handleHttp(res, "ERROR_UPDATE_USER");
  }
};

const deleteUser = async (req: Request, res: Response) => {
  try {
    const db = await InitFirebase().firestore();
    const userId: string = (req as any).decoded?.id;

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).send("User not found in the database");
    }

    await userRef.delete();

    return res.status(200).send("User removed from the database");
  } catch (error) {
    return handleHttp(res, "ERROR_DELETE_USER");
  }
};

export { getAllUsers, getUserByToken, updateUser, deleteUser, googleLogin };
