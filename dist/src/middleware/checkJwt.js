"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkJwt = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const index_1 = __importDefault(require("../config/index"));
const checkJwt = (req, res, next) => {
    // Get the JWT from the request header.
    const token = req.headers["authorization"];
    let jwtPayload;
    console.log("token: " + token);
    // Validate the token and retrieve its data.
    try {
        // Verify the payload fields.
        jwtPayload = (0, jsonwebtoken_1.verify)(token === null || token === void 0 ? void 0 : token.split(" ")[1], index_1.default.jwt.secret, {
            complete: true,
            audience: index_1.default.jwt.audience,
            issuer: index_1.default.jwt.issuer,
            algorithms: ["HS256"],
            clockTolerance: 0,
            ignoreExpiration: false,
            ignoreNotBefore: false,
        });
        // Add the payload to the request so controllers may access it.
        console.log("jwt token validated");
        req.token = jwtPayload;
        console.log("jwt token " + req.token.payload.merchantId);
    }
    catch (error) {
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
exports.checkJwt = checkJwt;
