import dotenv from "dotenv";
import { Environment } from "square";

export const getMerchantEnvironment = () => {
  return process.env.NODE_ENV == "production"
    ? Environment.Production
    : Environment.Sandbox;
};

export function isBoolean(val: any) {
  return val === false || val === true || val instanceof Boolean;
}

export const obsfucatePhoneNumber = (phoneNumber: string) => {
  let maskedPhoneNumber = phoneNumber.replace("+", "");
  let reversedNumber = "";
  for (let char of maskedPhoneNumber) {
    reversedNumber = char + reversedNumber;
  }
  return reversedNumber;
};

export const unobsfucatePhoneNumber = (obsfucatedNumber: string) => {
  let reversedNumber = "";
  for (let char of obsfucatedNumber) {
    reversedNumber = char + reversedNumber;
  }
  return "+" + reversedNumber;
};

export function paginateResponse(data: any, page: number, limit: number) {
  const [result, total] = data;
  const lastPage = Math.ceil(total / limit);
  const nextPage = page + 1 > lastPage ? null : page + 1;
  const prevPage = page - 1 < 1 ? null : page - 1;
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

export function paginateResponseWithoutTotal(
  data: any,
  page: number,
  limit: number
) {
  const [result, total] = data;
  const lastPage = Math.ceil(total / limit);
  const nextPage = page + 1 > lastPage ? null : page + 1;
  const prevPage = page - 1 < 1 ? null : page - 1;
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

module.exports = {
  obsfucatePhoneNumber,
  getMerchantEnvironment,
  isBoolean,
  paginateResponse,
  paginateResponseWithoutTotal,
  unobsfucatePhoneNumber,
};
