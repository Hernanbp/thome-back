import busboy from "busboy";
import { Request, Response } from "express";
import { InitStorage } from "../config/db/init-firebase";
// import { giveCurrentDateTime } from "../helpers";
// import { v4 as uuidv4 } from "uuid";
// import { InitStorage } from "../config/db/init-firebase";

//@ts-ignore
const upload = async (req: Request, res: Response) => {
  try {
    const bb = busboy({ headers: req.headers });

    bb.on("file", (name, file, info) => {
      const { filename, encoding, mimeType } = info;
      const bucket = InitStorage();
      const storagePath = `test/${filename}`;
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

export { upload };
