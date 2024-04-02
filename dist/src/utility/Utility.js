"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginateResponseWithoutTotal = exports.paginateResponse = exports.unobsfucatePhoneNumber = exports.obsfucatePhoneNumber = exports.isBoolean = exports.getMerchantEnvironment = void 0;
const square_1 = require("square");
const getMerchantEnvironment = () => {
    return process.env.NODE_ENV == "production2222"
        ? square_1.Environment.Production
        : square_1.Environment.Sandbox;
};
exports.getMerchantEnvironment = getMerchantEnvironment;
function isBoolean(val) {
    return val === false || val === true || val instanceof Boolean;
}
exports.isBoolean = isBoolean;
const obsfucatePhoneNumber = (phoneNumber) => {
    let maskedPhoneNumber = phoneNumber.replace("+", "");
    let reversedNumber = "";
    for (let char of maskedPhoneNumber) {
        reversedNumber = char + reversedNumber;
    }
    return reversedNumber;
};
exports.obsfucatePhoneNumber = obsfucatePhoneNumber;
const unobsfucatePhoneNumber = (obsfucatedNumber) => {
    let reversedNumber = "";
    for (let char of obsfucatedNumber) {
        reversedNumber = char + reversedNumber;
    }
    return "+" + reversedNumber;
};
exports.unobsfucatePhoneNumber = unobsfucatePhoneNumber;
function paginateResponse(data, page, limit) {
    const [result, total] = data;
    const lastPage = Math.ceil(total / limit);
    const nextPage = page + 1 > lastPage ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;
    console.log("inside paginateResponse with data: " +
        data +
        ", page:" +
        page +
        ", limit: " +
        limit);
    console.log("total: " +
        total +
        ", nextPage: " +
        nextPage +
        ", prevPage: " +
        prevPage +
        ", lastPage: " +
        lastPage);
    return {
        statusCode: "success",
        data: [...result],
        count: total,
        currentPage: page,
        nextPage: nextPage,
        prevPage: prevPage,
        lastPage: lastPage,
    };
}
exports.paginateResponse = paginateResponse;
function paginateResponseWithoutTotal(data, page, limit) {
    const [result, total] = data;
    const lastPage = Math.ceil(total / limit);
    const nextPage = page + 1 > lastPage ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;
    console.log("inside paginateResponse with data: " +
        data +
        ", page:" +
        page +
        ", limit: " +
        limit);
    console.log("total: " +
        total +
        ", nextPage: " +
        nextPage +
        ", prevPage: " +
        prevPage +
        ", lastPage: " +
        lastPage);
    return {
        statusCode: "success",
        // data: [...result],
        data: data,
        // count: total,
        currentPage: page,
        nextPage: nextPage,
        prevPage: prevPage,
        lastPage: lastPage,
    };
}
exports.paginateResponseWithoutTotal = paginateResponseWithoutTotal;
module.exports = {
    obsfucatePhoneNumber: exports.obsfucatePhoneNumber,
    getMerchantEnvironment: exports.getMerchantEnvironment,
    isBoolean,
    paginateResponse,
    paginateResponseWithoutTotal,
    unobsfucatePhoneNumber: exports.unobsfucatePhoneNumber,
};
