import { Request, Response } from "express";
import { InitFirebase } from "../config/db/init-firebase";
import { giveCurrentDateTime } from "../helpers";

const db = InitFirebase().firestore();
const favouritesRef = db.collection("favourites");

const addFavourite = async (req: Request, res: Response) => {
  //@ts-ignore
  const decoded = req.decoded;

  const userId = decoded.id;
  const propertyId = req.params.id;
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

const removeFavourite = async (req: Request, res: Response) => {
  //@ts-ignore
  const userId = req.decoded.id;
  const favouriteId = req.params.id;

  try {
    const favouriteRef = db.collection("favourites").doc(favouriteId);
    const favouriteDoc = await favouriteRef.get();

    if (!favouriteDoc.exists) {
      return res.status(404).send("Favourite not found");
    }

    const favouriteData = favouriteDoc.data();
    //@ts-ignore
    if (favouriteData.userId !== userId) {
      return res.status(403).send("Unauthorized");
    }

    await favouriteRef.delete();

    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting favourite:", error);
    return res.status(500).send("Internal server error");
  }
};

const getFavourites = async (req: Request, res: Response) => {
  //@ts-ignore
  const userId = req.decoded.id;

  try {
    const favourites = await favouritesRef.where("userId", "==", userId).get();

    const data = favourites.docs.map((doc) => {
      const docData = doc.data();
      return { id: doc.id, ...docData };
    });

    return res.status(200).send(data);
  } catch (error) {
    return res.status(500).send("Internal server error");
  }
};

export { addFavourite, getFavourites, removeFavourite };
