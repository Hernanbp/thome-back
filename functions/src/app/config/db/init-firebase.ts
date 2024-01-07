import admin from "firebase-admin";
import * as storage from "@google-cloud/storage";
import {
  CLIENT_EMAIL,
  PRIVATE_KEY,
  PROJECT_ID,
  PUBLIC_BUCKET,
} from "../config";

let initializedApp: admin.app.App;

const InitFirebase = () => {
  if (!initializedApp) {
    initializedApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: PROJECT_ID,
        clientEmail: CLIENT_EMAIL,
        privateKey: PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }

  return initializedApp;
};

const storageBucket = PUBLIC_BUCKET; // Reemplaza con el ID de tu bucket de Firebase Storage

const InitStorage = () => {
  const storageClient = new storage.Storage({
    projectId: PROJECT_ID,
    credentials: {
      client_email: CLIENT_EMAIL,
      private_key: PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
  });

  const bucket = storageClient.bucket(storageBucket);

  return bucket;
};

export { InitFirebase, InitStorage };
