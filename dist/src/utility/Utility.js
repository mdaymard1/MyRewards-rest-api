"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginateResponse = exports.unobsfucatePhoneNumber = exports.obsfucatePhoneNumber = exports.getMerchantEnvironment = void 0;
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
function paginateResponse(data, page, limit) {
    const [result, total] = data;
    const lastPage = Math.ceil(total / limit);
    const nextPage = page + 1 > lastPage ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;
    return {
        statusCode: 'success',
        data: [...result],
        count: total,
        currentPage: page,
        nextPage: nextPage,
        prevPage: prevPage,
        lastPage: lastPage,
    };
}
exports.paginateResponse = paginateResponse;
module.exports = {
    obsfucatePhoneNumber: exports.obsfucatePhoneNumber,
    getMerchantEnvironment: exports.getMerchantEnvironment,
    paginateResponse,
    unobsfucatePhoneNumber: exports.unobsfucatePhoneNumber,
};
