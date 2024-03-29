import busboy from "busboy";
import { Request, Response } from "express";
import { InitFirebase, InitStorage } from "../config/db/init-firebase";
import { giveCurrentDateTime, handleNestedField } from "../helpers";
import { Property } from "../types/types";

const db = InitFirebase().firestore();
const propertyRef = db.collection("properties");
type AllowedFields = keyof Property;

const createProperty = async (req: Request, res: Response) => {
  try {
    const bb = busboy({ headers: req.headers });

    const images: string[] = [];
    const amenities: string[] = [];
    const ownerId = (req as any).decoded.id;

    const productData: Property = {
      ownerId: ownerId,
      description: "",
      purpose: "sell",
      propertyType: "",
      price: {
        ars: 0,
        usd: 0,
      },
      hasExpenses: false,
      expensesPrice: {
        ars: 0,
        usd: 0,
      },
      lat: "",
      long: "",
      geohash: "",
      address: {
        province: "",
        neighborhood: "",
        street: "",
        number: 0,
        postalCode: "",
      },
      isActive: true,
      squareMeters: 0,
      rooms: 0,
      bedrooms: 0,
      bathrooms: 0,
      parkingSpaces: 0,
      amenities: amenities,
      propertyBonus: "",
      images: images,
      tags: [],
    };

    bb.on("file", async (name, file, info) => {
      const { filename, mimeType } = info;
      const bucket = InitStorage();
      const storagePath = `files/images/${filename}_${giveCurrentDateTime()}`;
      const fileUpload = bucket.file(storagePath);

      const url = await fileUpload.getSignedUrl({
        action: "read",
        expires: "03-01-2100",
      });

      const finalUrl = url.toString();

      file.pipe(fileUpload.createWriteStream({ contentType: mimeType }));

      file.on("end", async () => {
        images.push(finalUrl);
      });
    });

    bb.on("field", (name, val) => {
      handleNestedField(productData, name, val);

      if (name === "amenities") {
        const amenitiesList = val.split(",").map((amenity) => amenity.trim());
        amenities.push(...amenitiesList);
        //@ts-ignore
      } else if (Object.keys(productData).includes(name as AllowedFields)) {
        const isNumeric = !isNaN(parseFloat(val)) && isFinite(parseFloat(val));
        const isBoolean = val === "true" || val === "false";

        if (isNumeric) {
          productData[name as AllowedFields] = parseFloat(val);
        } else if (isBoolean) {
          productData[name as AllowedFields] = val === "true";
        } else {
          productData[name as AllowedFields] = val;
        }
      } else {
        console.error(`Invalid field: ${name}`);
      }
    });

    bb.on("finish", async () => {
      productData.images = images;
      productData.amenities = amenities;

      const tags = [
        `propertyType ${productData.propertyType}`,
        `rooms ${productData.rooms}`,
        `bedrooms ${productData.bedrooms}`,
        `amenities ${amenities.join(", ")}`,
        `purpose ${productData.purpose}`,
      ];

      productData.tags = tags;

      await db.collection("properties").add(productData);

      res.status(200).send(productData);
    });

    bb.end(req.body);

    return;
  } catch (error) {
    console.error(error);
    return res.status(500).send("Error uploading image");
  }
};

const getAllProperties = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
    const field = req.query.field || "price.ars";
    const startAfterDoc = req.query.startAfterDoc as string | undefined;

    //filters
    const purpose = req.query.purpose;
    const propertyType = req.query.propertyType;
    const squareMeters = Number(req.query.squareMeters);
    const rooms = Number(req.query.rooms);
    const bedrooms = Number(req.query.bedrooms);
    let amenities = req.query.amenities;

    let query = propertyRef.orderBy(field.toString()).limit(pageSize);

    if (purpose) {
      query = query.where("purpose", "==", purpose);
    }

    if (propertyType) {
      query = query.where("propertyType", "==", propertyType);
    }

    if (squareMeters) {
      query = query.where("squareMeters", "==", squareMeters);
    }

    if (rooms) {
      query = query.where("rooms", "==", rooms);
    }

    if (bedrooms) {
      query = query.where("bedrooms", "==", bedrooms);
    }

    if (typeof amenities === "string") {
      amenities = amenities.split(",");
    }

    //@ts-ignore
    if (amenities !== undefined && amenities.length > 0) {
      query = query.where("amenities", "array-contains-any", amenities);
    }

    if (startAfterDoc) {
      const startAfterSnapshot = await propertyRef.doc(startAfterDoc).get();
      query = query.startAfter(startAfterSnapshot);
    } else if (page > 1) {
      const startAt = (page - 1) * pageSize;
      query = query.startAt(startAt);
    }

    const querySnapshot = await query.get();
    let properties = querySnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ properties, nextPage: querySnapshot.docs.length === pageSize });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getPropertyById = async (req: Request, res: Response) => {
  try {
    const propertyId = req.params.id;
    const property = await propertyRef.doc(propertyId).get();

    if (!property.exists) {
      return res.status(404).send("Property not found");
    }

    const propertyData = property.data() as Property;
    propertyData.id = property.id;
    return res.status(200).send(propertyData);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

const getPropertiesByOwner = async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).decoded.id;
    const documents = await propertyRef.where("ownerId", "==", ownerId).get();

    const properties = documents.docs.map((doc) => {
      const docData = doc.data();
      return { id: doc.id, ...docData };
    });

    if (properties.length === 0) {
      return res.status(200).send("No properties found for this owner.");
    }

    return res.status(200).send(properties);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

const updateProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const bb = busboy({ headers: req.headers });

    const existingDoc = (await propertyRef.doc(id).get()).data() as Property;

    const updates: Partial<Property> = { ...existingDoc };
    const amenities: string[] = [];

    bb.on("file", async (name, file, info) => {
      const { filename, mimeType } = info;
      const bucket = InitStorage();
      const storagePath = `files/images/${filename}_${giveCurrentDateTime()}`;
      const fileUpload = bucket.file(storagePath);

      const url = await fileUpload.getSignedUrl({
        action: "read",
        expires: "03-01-2100",
      });

      const finalUrl = url.toString();

      file.pipe(fileUpload.createWriteStream({ contentType: mimeType }));

      file.on("end", async () => {
        existingDoc.images.push(finalUrl);
      });
    });

    bb.on("field", (name, val) => {
      handleNestedField(updates, name, val);

      if (name === "amenities") {
        const amenitiesList = val.split(",").map((amenity) => amenity.trim());
        amenities.push(...amenitiesList);
      }
      //@ts-ignore
      if (Object.keys(updates).includes(name as AllowedFields)) {
        const isNumeric = !isNaN(parseFloat(val)) && isFinite(parseFloat(val));
        const isBoolean = val === "true" || val === "false";

        if (isNumeric) {
          updates[name as AllowedFields] = parseFloat(val);
        } else if (isBoolean) {
          updates[name as AllowedFields] = val === "true";
        } else {
          updates[name as AllowedFields] = val;
        }
      } else {
        console.error(`Invalid field: ${name}`);
      }
    });

    bb.on("finish", async () => {
      updates.amenities = amenities;
      await db.collection("properties").doc(id).update(updates);

      res.status(200).send(updates);
    });

    bb.end(req.body);

    return;
  } catch (error) {
    console.error(error);
    return res.status(500).send("Error updating property");
  }
};

const deleteProperty = async (req: Request, res: Response) => {
  try {
    const propertyId = req.params.id;
    await propertyRef.doc(propertyId).delete();

    return res.status(200).send("Property successfully deleted");
  } catch (error) {
    return res.status(500).send("Internal Server Error");
  }
};

const all = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
    const field = req.query.field || "price.ars";
    const startAfterDoc = req.query.startAfterDoc as string | undefined;

    // Obtener los tags de los parámetros de consulta y concatenarlos en un solo string
    const tagsQuery = req.query.tags as string;
    const tags = tagsQuery ? tagsQuery.split(",") : [];

    console.log("tags:", tags);

    let query = propertyRef.orderBy(field.toString()).limit(pageSize);

    // Filtrar por tags
    if (tags.length > 0) {
      query = query.where("tags", "array-contains-any", tags);
    }

    if (startAfterDoc) {
      const startAfterSnapshot = await propertyRef.doc(startAfterDoc).get();
      query = query.startAfter(startAfterSnapshot);
    } else if (page > 1) {
      const startAt = (page - 1) * pageSize;
      query = query.startAt(startAt);
    }

    const querySnapshot = await query.get();
    let properties = querySnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ properties, nextPage: querySnapshot.docs.length === pageSize });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export {
  all,
  updateProperty,
  createProperty,
  getAllProperties,
  deleteProperty,
  getPropertyById,
  getPropertiesByOwner,
};
