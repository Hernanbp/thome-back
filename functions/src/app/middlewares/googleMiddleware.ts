import { NextFunction, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";

interface CustomRequest extends Request {
  email?: string;
  payload?: any;
}

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

async function googleMiddleware(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(503).send("Unauthorized");
  }
  if (authHeader) {
    const token = authHeader.split(" ")[1];

    try {
      const ticket = await oAuth2Client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      req.payload = payload;

      return next();
    } catch (error) {
      return res.status(503).send("Unauthorized");
    }
  }
  return res.status(503).send("Unauthorized");
}

export { googleMiddleware };
