// import { getDownloadURL } from "firebase-admin/storage";
import busboy from "busboy";
import { Request, Response } from "express";
import { InitFirebase, InitStorage } from "../config/db/init-firebase";
import { giveCurrentDateTime } from "../helpers";
import { Property } from "../types/types";

const db = InitFirebase().firestore();
const propertyRef = db.collection("properties");

const upload = async (req: Request, res: Response) => {
  try {
    const bb = busboy({ headers: req.headers });

    const images: string[] = [];
    const amenities: string[] = [];
    const propertyBonus: string[] = [];

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
      amenities: amenities,
      propertyBonus: propertyBonus,
      images: images,
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

    type AllowedFields = keyof Property;

    const handleNestedField = (obj: any, name: string, val: any) => {
      const matches = name.match(/^(\w+)\[(\w+)\]$/);
      if (matches) {
        const [, nestedProperty, nestedKey] = matches;
        if (obj[nestedProperty] && typeof obj[nestedProperty] === "object") {
          const isNumeric =
            !isNaN(parseFloat(val)) && isFinite(parseFloat(val));
          obj[nestedProperty][nestedKey] = isNumeric ? parseFloat(val) : val;
        } else {
          console.error(`Invalid nested property: ${nestedProperty}`);
        }
      }
    };

    bb.on("field", (name, val) => {
      handleNestedField(productData, name, val);

      if (name === "propertyBonus") {
        propertyBonus.push(val);
      } else if (name === "amenities") {
        amenities.push(val);
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
      productData.propertyBonus = propertyBonus;

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
  upload,
  getAllProperties,
  deleteProperty,
  getPropertyById,
  updateProperty,
};
