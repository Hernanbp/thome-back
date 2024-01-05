import admin from "firebase-admin";
import { CLIENT_EMAIL, PRIVATE_KEY, PROJECT_ID } from "../config";

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

export default InitFirebase;
