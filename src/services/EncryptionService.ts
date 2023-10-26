import crypto from "crypto";

const key = "f7fbba6e0636f890e56fbbf3283e524c";
const encryptionIV = "d82c4eb5261cb9c8";
const algorithm = "aes-256-cbc";

export const encryptToken = (encryptedToken: string) => {
  try {
    const cipher = crypto.createCipheriv(algorithm, key, encryptionIV);
    let decryptedToken = cipher.update(encryptedToken, "base64", "utf8");
    decryptedToken += cipher.final("utf8");
    return decryptedToken.toString();
    } catch (err) {
      console.log("encryptToken got error: " + err);
  }
}

export const decryptToken = (encryptedToken: string) => {
  try {
    const decipher = crypto.createDecipheriv(algorithm, key, encryptionIV);
    let decryptedToken = decipher.update(encryptedToken, "base64", "utf8");
    decryptedToken += decipher.final("utf8");
    return decryptedToken;
  } catch (exception: any) {
    console.log("error while decrypting token: " + exception)
    return undefined;
  }
}

module.exports = {
  encryptToken,
  decryptToken,
}
