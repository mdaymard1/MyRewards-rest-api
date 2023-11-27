"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptToken = exports.encryptToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const key = 'f7fbba6e0636f890e56fbbf3283e524c';
const encryptionIV = 'd82c4eb5261cb9c8';
const algorithm = 'aes-256-cbc';
const encryptToken = (encryptedToken) => {
    try {
        const cipher = crypto_1.default.createCipheriv(algorithm, key, encryptionIV);
        let decryptedToken = cipher.update(encryptedToken, 'base64', 'utf8');
        // decryptedToken += cipher.final("utf8");
        decryptedToken += cipher.final('hex');
        return decryptedToken.toString();
    }
    catch (err) {
        console.log('encryptToken got error: ' + err);
    }
};
exports.encryptToken = encryptToken;
const decryptToken = (encryptedToken) => {
    try {
        const decipher = crypto_1.default.createDecipheriv(algorithm, key, encryptionIV);
        let decryptedToken = decipher.update(encryptedToken, 'base64', 'utf8');
        decryptedToken += decipher.final('utf8');
        return decryptedToken;
    }
    catch (exception) {
        console.log('error while decrypting token: ' + exception);
        return undefined;
    }
};
exports.decryptToken = decryptToken;
module.exports = {
    encryptToken: exports.encryptToken,
    decryptToken: exports.decryptToken,
};
