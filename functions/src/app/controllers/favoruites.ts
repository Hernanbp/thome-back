import { Request, Response } from "express";
import { InitFirebase } from "../config/db/init-firebase";
import { giveCurrentDateTime } from "../helpers";

const db = InitFirebase().firestore();
const favouritesRef = db.collection("favourites");
const propertiesRef = db.collection("properties");
const usersRef = db.collection("users");

const createFavourite = async (req: Request, res: Response) => {
  //@ts-ignore
  const decoded = req.decoded;

  const userId = decoded.id;
  const propertyId = req.body.propertyId;
  const createdAt = giveCurrentDateTime();

  try {
    const favouriteRef = await favouritesRef.add({
      userId: userId,
      propertyId: propertyId,
      createdAt: createdAt,
    });

    const favouriteId = favouriteRef.id;

    const data = { id: favouriteId, userId, propertyId, createdAt };

    return res.status(200).send(data);
  } catch (error) {
    return res.status(500).send("Internal server error");
  }
};

const getFavourites = async (req: Request, res: Response) => {};

export { createFavourite };
