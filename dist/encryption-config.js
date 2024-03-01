"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionTransformerConfig = void 0;
exports.EncryptionTransformerConfig = {
    key: process.env.ENCRYPTION_KEY,
    algorithm: 'aes-256-cbc',
    ivLength: 16,
    iv: 'ff5ac19190424b1d88f9419ef949ae56',
};
