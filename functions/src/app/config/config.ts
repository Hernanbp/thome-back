const SECRET_TOKEN_AUTH = process.env.SECRET_TOKEN_AUTH as string;
const PUBLIC_BUCKET = process.env.PUBLIC_BUCKET as string;
const PROJECT_ID = process.env.PROJECT_ID as string;
const CLIENT_EMAIL = process.env.CLIENT_EMAIL as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const COOKIE_SESSION_KEY = process.env.COOKIE_SESSION_KEY as string;

export {
  SECRET_TOKEN_AUTH,
  PUBLIC_BUCKET,
  PROJECT_ID,
  CLIENT_EMAIL,
  PRIVATE_KEY,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  COOKIE_SESSION_KEY,
};
