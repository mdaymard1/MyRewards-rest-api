import { Request, Response, NextFunction } from "express";
import { verify, JwtPayload } from "jsonwebtoken";
import config from "../config/index";

export interface CustomRequest extends Request {
  token: JwtPayload;
}

export const checkJwt = (req: Request, res: Response, next: NextFunction) => {
  // Get the JWT from the request header.
  const token = <string>req.headers["authorization"];
  let jwtPayload;

  console.log("token: " + token);

  // Validate the token and retrieve its data.
  try {
    // Verify the payload fields.
    jwtPayload = <any>verify(token?.split(" ")[1], config.jwt.secret!, {
      complete: true,
      audience: config.jwt.audience,
      issuer: config.jwt.issuer,
      algorithms: ["HS256"],
      clockTolerance: 0,
      ignoreExpiration: false,
      ignoreNotBefore: false,
    });
    // Add the payload to the request so controllers may access it.
    console.log("jwt token validated");
    (req as CustomRequest).token = jwtPayload;
    console.log("jwt token " + (req as CustomRequest).token.payload.merchantId);
  } catch (error) {
    console.log("Error thrown while verifying jwt token: " + error);
    res
      .status(401)
      .type("json")
      .send(JSON.stringify({ message: "Missing or invalid token" }));
    return;
  }

  // Pass programmatic flow to the next middleware/controller.
  next();
};
