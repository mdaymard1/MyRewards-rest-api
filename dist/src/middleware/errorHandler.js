"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const customError_1 = require("../exceptions/customError");
function errorHandler(err, req, res, next) {
    console.error(err);
    if (!(err instanceof customError_1.CustomError)) {
        res.status(500).send(JSON.stringify({
            message: "Server error, please try again later",
        }));
    }
    else {
        const customError = err;
        let response = {
            message: customError.message,
        };
        // Check if there is more info to return.
        if (customError.additionalInfo)
            response.additionalInfo = customError.additionalInfo;
        res.status(customError.status).type("json").send(JSON.stringify(response));
    }
}
exports.errorHandler = errorHandler;
