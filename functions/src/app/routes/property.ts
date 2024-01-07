import { Router } from "express";
import { InitStorage } from "../config/db/init-firebase";
import fs from "fs";
import os from "os";
import path from "path";
import { giveCurrentDateTime } from "../helpers";
import { v4 as uuidv4 } from "uuid";
import mime from "mime-types";

const router = Router();

router.post("/upload", async (req, res) => {
  try {
    const bucket = InitStorage();

    const file = req.body.file;

    if (!file) {
      return res.status(400).send("No file given");
    }
    const fileName = `files/images/${giveCurrentDateTime()}_${uuidv4()}`;

    // Creas un archivo temporal
    const tempFilePath = path.join(os.tmpdir(), "tempFile");
    fs.writeFileSync(tempFilePath, file, "base64");

    const contentType = mime.lookup(tempFilePath) || "application/octet-stream";

    // Subes el archivo al bucket
    await bucket.upload(tempFilePath, {
      destination: fileName,
      metadata: {
        contentType: contentType, // Ajusta el tipo de contenido según tus necesidades
      },
    });

    // Eliminas el archivo temporal después de subirlo al bucket
    fs.unlinkSync(tempFilePath);

    // Envías una respuesta indicando éxito
    return res.status(200).send("File uploaded");
  } catch (error) {
    return res.status(500).send("Error uploading image");
  }
});

router.get("/test", (req, res) => {
  return res.status(200).json({ message: "todo ok en property" });
});

export { router };
