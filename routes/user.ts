import { Request, Response } from "express";
import { getBusinessIdFromAuthToken } from "../src/services/BusinessService";
import {
  getUserLoyaltyDetails,
  sendSMSVerification,
  verifyCodeIsValid,
} from "../src/services/UserService";

const getLoyalty = async (request: Request, response: Response) => {
  console.log("inside getLoyalty");

  const businessId = getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(400);
    response.end();
    return;
  }

  const { userId } = request.params;

  if (!userId) {
    response.status(400);
    response.end();
    return;
  }

  const userLoyalty = await getUserLoyaltyDetails(businessId, userId);

  if (userLoyalty) {
    response.send(userLoyalty);
  } else {
    response.status(400);
  }
  response.end();
};

const requestUserPhoneNumberVerification = async (
  request: Request,
  response: Response
) => {
  console.log("inside requestCustomerPhoneNumberVerification");

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

const verifyUserCode = async (request: Request, response: Response) => {
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

  const appUser = await verifyCodeIsValid(
    countryCode,
    phoneNumber,
    businessId,
    code
  );

  if (appUser) {
    const appUserIdResponse = {
      appuserId: appUser.id,
    };
    response.send(appUserIdResponse);
  } else {
    response.status(400);
  }
  response.end();
};

module.exports = {
  getLoyalty,
  requestUserPhoneNumberVerification,
  verifyUserCode,
};