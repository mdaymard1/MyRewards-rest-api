import { Request, Response } from "express";
import { getBusinessIdFromAuthToken } from "../src/services/BusinessService";
import {
  sendSMSVerification,
  verifyCodeIsValid,
} from "../src/services/CustomerService";

const requestVerification = async (request: Request, response: Response) => {
  console.log("inside requestCustomerVerification");

  const businessId = getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(400);
    response.end();
    return;
  }

  const { countryCode, phoneNumber } = request.body;

  console.log("countryCode: " + countryCode + ", phoneNumber: " + phoneNumber);

  //   await sendSMSVerification(countryCode, phoneNumber, businessId);
  const status = await sendSMSVerification(
    countryCode,
    phoneNumber,
    businessId
  );

  if (status && status == "pending") {
    response.status(200);
  } else {
    response.status(400);
  }
  response.end();
};

const verifyCode = async (request: Request, response: Response) => {
  console.log("inside verifyCode");

  const businessId = getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(400);
    response.end();
    return;
  }

  const { countryCode, phoneNumber, code } = request.body;

  console.log(
    "countryCode: " +
      countryCode +
      ", phoneNumber: " +
      phoneNumber +
      ", code: " +
      code
  );

  const status = await verifyCodeIsValid(
    countryCode,
    phoneNumber,
    businessId,
    code
  );

  if (status && status == "approved") {
    response.status(200);
  } else {
    response.status(400);
  }
  response.end();
};

module.exports = {
  requestVerification,
  verifyCode,
};
