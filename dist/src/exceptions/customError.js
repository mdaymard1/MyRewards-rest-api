"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomError = void 0;
// Note: Our custom error extends from Error, so we can throw this error as an exception.
class CustomError extends Error {
    constructor(message, status = 500, additionalInfo = undefined) {
        super(message);
        this.message = message;
        this.status = status;
        this.additionalInfo = additionalInfo;
    }
}
exports.CustomError = CustomError;
