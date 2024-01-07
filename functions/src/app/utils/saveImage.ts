import { PUBLIC_BUCKET } from "../config/config";
import { InitFirebase } from "../config/db/init-firebase";

export const SaveFile = async (file: any, path: string) => {
  try {
    const store_bucket = await InitFirebase().storage();
    const data = Buffer.from(file.buffer, "base64");
    await store_bucket
      .bucket(PUBLIC_BUCKET)
      .file(path)
      .save(
        data,
        {
          predefinedAcl: "publicRead",
          public: true,
          metadata: {
            contentType: file.mimetype,
          },
        },
        (err) => {
          if (err) {
            console.log(err);
          }
        }
      );
    return { success: true, message: "Archivo subido exitosamente" };
  } catch (err) {
    return err;
  }
};
