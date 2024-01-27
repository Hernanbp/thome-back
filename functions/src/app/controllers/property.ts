import busboy from "busboy";
import { Request, Response } from "express";
import { InitFirebase, InitStorage } from "../config/db/init-firebase";
import { giveCurrentDateTime } from "../helpers";
import { Property } from "../types/types";
import { v4 as uuidv4 } from "uuid";

const db = InitFirebase().firestore();
const propertyRef = db.collection("properties");

const upload = async (req: Request, res: Response) => {
  try {
    const bb = busboy({ headers: req.headers });

    const images: string[] = [];
    const productData: Property = {
      ownerId: "",
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
      address: {
        street: "",
        number: 0,
        postalCode: "",
      },
      isActive: true,
      squareMeters: 0,
      coveredAreaSquareMeters: 0,
      rooms: 0,
      bedrooms: 0,
      bathrooms: 0,
      parkingSpaces: 0,
      amenities: [],
      propertyBonus: [],
      images: images,
    };

    bb.on("file", (name, file, info) => {
      const { filename, mimeType } = info;
      const bucket = InitStorage();
      const storagePath = `files/images/${filename}_${giveCurrentDateTime()}`;
      const fileUpload = bucket.file(storagePath);

      file.pipe(fileUpload.createWriteStream({ contentType: mimeType }));

      file.on("end", async () => {
        const imageUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
        images.push(imageUrl);
      });
    });

    type AllowedFields = keyof Property;

    bb.on("field", (name, val) => {
      const matches = name.match(/(\w+)\[(\w+)\]/);

      if (matches) {
        const [, nestedProperty, nestedKey] = matches;

        if (
          //@ts-ignore
          productData[nestedProperty] &&
          //@ts-ignore
          typeof productData[nestedProperty] === "object"
        ) {
          //@ts-ignore
          productData[nestedProperty][nestedKey] = val;
        } else {
          console.error(`Invalid nested property: ${nestedProperty}`);
        }
      } else {
        // Check if the field is allowed
        if (Object.keys(productData).includes(name as AllowedFields)) {
          //@ts-ignore
          productData[name as AllowedFields] = val;
        } else {
          console.error(`Invalid field: ${name}`);
        }
      }
    });

    bb.on("finish", async () => {
      productData.images = images;
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

const createProperty = async (req: Request, res: Response) => {
  try {
    const propertyId = uuidv4();

    const requestBody = req.body;

    const newProperty: Property = {
      id: propertyId,
      ownerId: requestBody.ownerId,
      purpose: requestBody.purpose,
      propertyType: requestBody.propertyType,
      price: {
        ars: requestBody.price?.ars,
        usd: requestBody.price?.usd,
      },
      hasExpenses: requestBody.hasExpenses,
      expensesPrice: {
        ars: requestBody.expensesPrice?.ars || null,
        usd: requestBody.expensesPrice?.usd || null,
      },
      address: {
        street: requestBody.address?.street || "",
        number: requestBody.address?.number || 0,
        postalCode: requestBody.address?.postalCode || "",
      },
      isActive: true,
      squareMeters: requestBody.squareMeters || 0,
      coveredAreaSquareMeters: requestBody.coveredAreaSquareMeters || 0,
      rooms: requestBody.rooms || 0,
      bedrooms: requestBody.bedrooms || 0,
      bathrooms: requestBody.bathrooms || 0,
      parkingSpaces: requestBody.parkingSpaces || 0,
      amenities: requestBody.amenities || [],
      propertyBonus: requestBody.propertyBonus || [],
      images: requestBody.images || [],
    };

    await propertyRef.doc(propertyId).set(newProperty);

    return res.status(201).json(newProperty);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

const getAllProperties = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
    const field = req.query.field || "price.ars";

    const startAfterDoc = req.query.startAfterDoc as string | undefined;

    let query = propertyRef.orderBy(field.toString()).limit(pageSize);

    if (startAfterDoc) {
      const startAfterSnapshot = await propertyRef.doc(startAfterDoc).get();
      query = query.startAfter(startAfterSnapshot);
    } else if (page > 1) {
      const startAt = (page - 1) * pageSize;
      query = query.startAt(startAt);
    }

    const querySnapshot = await query.get();
    const properties = querySnapshot.docs.map((doc: any) => ({
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

const updateProperty = async (req: Request, res: Response) => {
  try {
    const propertyId = req.params.id;
    const property = await propertyRef.doc(propertyId).get();

    if (!property.exists) {
      return res.status(404).send("Property not found");
    }

    const existingProperty = property.data() as Property;

    // Validar que los campos de la solicitud coincidan con la interfaz Property
    const updatedFields: Partial<Property> = req.body;

    for (const field in updatedFields) {
      if (!(field in existingProperty)) {
        return res.status(400).send(`Invalid field: ${field}`);
      }
    }

    // Actualizar solo los campos permitidos
    const updateData: Partial<Property> = {};

    for (const field in updatedFields) {
      if (field in existingProperty) {
        //@ts-ignore
        updateData[field as keyof Property] = updatedFields[field];
      }
    }

    const updateProperty = propertyRef.doc(propertyId);
    await updateProperty.update(updateData);

    const updatedPropertySnapshot = await updateProperty.get();
    const updatedProperty = updatedPropertySnapshot.data() as Property;
    return res.status(200).send(updatedProperty);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
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

export {
  createProperty,
  upload,
  getAllProperties,
  deleteProperty,
  getPropertyById,
  updateProperty,
};
