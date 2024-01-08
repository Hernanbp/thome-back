import busboy from "busboy";
import { Request, Response } from "express";
import { InitFirebase, InitStorage } from "../config/db/init-firebase";
import { giveCurrentDateTime } from "../helpers";
import { Property } from "../types/types";
// import { v4 as uuidv4 } from "uuid";

const db = InitFirebase().firestore();
const propertyRef = db.collection("properties");
//@ts-ignore
const upload = async (req: Request, res: Response) => {
  try {
    const bb = busboy({ headers: req.headers });

    bb.on("file", (name, file, info) => {
      const { filename, encoding, mimeType } = info;
      const bucket = InitStorage();
      const storagePath = `files/images/${
        filename + "    " + giveCurrentDateTime()
      }`;
      const fileUpload = bucket.file(storagePath);

      file.pipe(fileUpload.createWriteStream({ contentType: mimeType }));

      console.log(
        `File [${name}]: filename: %j, encoding: %j, mimeType: %j`,
        filename,
        encoding,
        mimeType
      );
      file
        .on("data", (data) => {
          console.log(`File [${name}] got ${data?.length} bytes`);
        })
        .on("close", () => {
          console.log(`File [${name}] done`);
        });
    });
    bb.on("field", (name, val, info) => {
      console.log(`Field [${name}]: value: %j`, val);
    });
    bb.on("close", () => {
      console.log("Done parsing form!");
      res.status(200).send({ message: "Done parsing form!" });
    });

    bb.end(req.body);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Error uploading image");
  }
};

const getProperties = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10;

    const startAfterDoc = req.query.startAfterDoc as string | undefined;

    let query = propertyRef.orderBy("price").limit(pageSize);

    if (startAfterDoc) {
      const startAfterSnapshot = await propertyRef.doc(startAfterDoc).get();
      query = query.startAfter(startAfterSnapshot);
    } else if (page > 1) {
      const startAt = (page - 1) * pageSize;
      query = query.startAt(startAt);
    }

    const querySnapshot = await query.get();
    const properties = querySnapshot.docs.map((doc: any) => doc.data());

    res.json({ properties, nextPage: querySnapshot.docs.length === pageSize });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getProperty = async (req: Request, res: Response) => {
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

    const updateProperty = propertyRef.doc(propertyId);
    await updateProperty.update({ ...req.body });

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

export { upload, getProperties, deleteProperty, getProperty, updateProperty };
