import * as dotenv from "dotenv";
dotenv.config();

const config = {
  // JWT important variables
  jwt: {
    // The secret is used to sign and validate signatures.
    secret: process.env.JWT_SECRET,
    // The audience and issuer are used for validation purposes.
    audience: process.env.JWT_AUDIENCE,
    issuer: process.env.JWT_ISSUER,
  },
  // The basic API prefix configuration values are:
  prefix: process.env.API_PREFIX || "api",
};

export default config;
