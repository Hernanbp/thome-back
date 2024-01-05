import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import InitFirebase from "../config/db/init-firebase";
import { User } from "../types/types";

const getUsers = async (req: Request, res: Response) => {
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

const getUser = async (req: Request, res: Response) => {
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
      roles: req.body.roles,
      status: req.body.status,
    };

    // Remove properties with undefined values to avoid overwriting with undefined
    Object.keys(updatedUserFields).forEach(
      (key) =>
        //@ts-ignore
        updatedUserFields[key] === undefined && delete updatedUserFields[key]
    );

    console.log("Updated User Fields:", updatedUserFields);

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

export { getUsers, getUser, updateUser, deleteUser };
