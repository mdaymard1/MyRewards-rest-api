import dotenv from 'dotenv';
import { Environment } from 'square';

export const getMerchantEnvironment = () => {
  return process.env.NODE_ENV == 'production2222'
    ? Environment.Production
    : Environment.Sandbox;
};

export const obsfucatePhoneNumber = (phoneNumber: string) => {
  let maskedPhoneNumber = phoneNumber.replace('+', '');
  let reversedNumber = '';
  for (let char of maskedPhoneNumber) {
    reversedNumber = char + reversedNumber;
  }
  return reversedNumber;
};

export const unobsfucatePhoneNumber = (obsfucatedNumber: string) => {
  let reversedNumber = '';
  for (let char of obsfucatedNumber) {
    reversedNumber = char + reversedNumber;
  }
  return '+' + reversedNumber;
};

module.exports = {
  obsfucatePhoneNumber,
  unobsfucatePhoneNumber,
  getMerchantEnvironment,
};
