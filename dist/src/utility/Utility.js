"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unobsfucatePhoneNumber = exports.obsfucatePhoneNumber = exports.getMerchantEnvironment = void 0;
const square_1 = require("square");
const getMerchantEnvironment = () => {
    return process.env.NODE_ENV == 'production2222'
        ? square_1.Environment.Production
        : square_1.Environment.Sandbox;
};
exports.getMerchantEnvironment = getMerchantEnvironment;
const obsfucatePhoneNumber = (phoneNumber) => {
    let maskedPhoneNumber = phoneNumber.replace('+', '');
    let reversedNumber = '';
    for (let char of maskedPhoneNumber) {
        reversedNumber = char + reversedNumber;
    }
    return reversedNumber;
};
exports.obsfucatePhoneNumber = obsfucatePhoneNumber;
const unobsfucatePhoneNumber = (obsfucatedNumber) => {
    let reversedNumber = '';
    for (let char of obsfucatedNumber) {
        reversedNumber = char + reversedNumber;
    }
    return '+' + reversedNumber;
};
exports.unobsfucatePhoneNumber = unobsfucatePhoneNumber;
module.exports = {
    obsfucatePhoneNumber: exports.obsfucatePhoneNumber,
    unobsfucatePhoneNumber: exports.unobsfucatePhoneNumber,
    getMerchantEnvironment: exports.getMerchantEnvironment,
};
