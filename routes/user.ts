import { Request, Response } from "express";
import { getBusinessIdFromAuthToken } from "../src/services/BusinessService";
import {
  addUserFavorite,
  deleteUserFavorite,
  getAllLoyaltyAccounts,
  getUserDetails,
  getUserFavorites,
  getUserLoyaltyDetails,
  getUserNotificationSettings,
  sendSMSVerification,
  updateUserBusinessNotificationSettings,
  updateUserDetails,
  updateUserNotificationSettings,
  updateUserWithDetails,
  verifyCodeIsValid,
} from "../src/services/UserService";
import { AppDataSource } from "../appDataSource";
import { Business } from "../src/entity/Business";
import { decryptToken } from "../src/services/EncryptionService";
import { isBoolean } from "../src/utility/Utility";

export const getFavorites = async (request: Request, response: Response) => {
  console.log("inside getFavorites");

  const { userId } = request.params;
  const { idsOnly } = request.query;

  if (!userId || !idsOnly) {
    response.status(400);
    response.end();
    return;
  }

  var onlyReturnIds = false;
  if (idsOnly == "true") {
    onlyReturnIds = true;
  }

  response.send(await getUserFavorites(userId, onlyReturnIds));
};

export const deleteFavorite = async (request: Request, response: Response) => {
  console.log("inside deleteFavorite");

  const { userId } = request.params;
  const { locationId } = request.body;

  if (!userId || !locationId) {
    response.status(404);
    response.end();
    return;
  }

  await deleteUserFavorite(userId, locationId);
  response.status(200);
  response.end();
};

export const addFavorite = async (request: Request, response: Response) => {
  console.log("inside addFavorite");

  const { userId } = request.params;

  if (!userId) {
    response.status(400);
    response.end();
    return;
  }

  const { locationId } = request.body;

  if (!locationId) {
    response.status(400);
    response.end();
    return;
  }

  const wasSuccessful = await addUserFavorite(userId, locationId);
  response.sendStatus(wasSuccessful ? 200 : 404);
  response.end();
};

export const updateBusinessNotificationSettings = async (
  request: Request,
  response: Response
) => {
  console.log("inside updateBusinessNotificationSettings");

  const { userId } = request.params;

  if (!userId) {
    response.status(400);
    return;
  }

  const {
    businessId,
    customerId,
    notifyOfRewardChanges,
    notifyOfPromotionChanges,
    notifyOfSpecialsChanges,
  } = request.body;

  console.log("checking for valid input");
  if (
    !businessId ||
    !customerId ||
    !isBoolean(notifyOfRewardChanges) ||
    !isBoolean(notifyOfPromotionChanges) ||
    !isBoolean(notifyOfSpecialsChanges)
  ) {
    response.status(400);
    response.end();
    return;
  }

  console.log("calling updateUserBusinessNotificationSettings");

  const notificationPref = await updateUserBusinessNotificationSettings(
    userId,
    businessId,
    customerId,
    notifyOfRewardChanges,
    notifyOfPromotionChanges,
    notifyOfSpecialsChanges
  );

  response.sendStatus(200);
  response.end();
};

export const getDetails = async (request: Request, response: Response) => {
  console.log("inside getDetails");

  const { userId } = request.params;

  if (!userId) {
    response.status(400);
    return;
  }

  const userDetails = await getUserDetails(userId);
  if (userDetails) {
    response.send(userDetails);
  } else {
    response.sendStatus(404);
  }
};

export const updateDetails = async (request: Request, response: Response) => {
  console.log("inside updateNotificationSettings");

  const { userId } = request.params;

  if (!userId) {
    response.status(400);
    return;
  }

  const { firstName, lastName, email } = request.body;

  if (!firstName) {
    response.status(400);
    return;
  }

  const status = await updateUserDetails(userId, firstName, lastName, email);
  if (status && status == "success") {
    response.sendStatus(200);
  } else {
    response.sendStatus(400);
  }
};

export const updateNotificationSettings = async (
  request: Request,
  response: Response
) => {
  console.log("inside updateNotificationSettings");

  const { userId } = request.params;

  if (!userId) {
    response.status(400);
    response.end();
    return;
  }

  const {
    coordinateLatitude,
    coordinateLongitude,
    zipCode,
    notifyOfNewBusinesses,
    notifyOfMyRewardChanges,
    notifyOfPointChanges,
  } = request.body;

  if (
    !isBoolean(notifyOfNewBusinesses) ||
    !isBoolean(notifyOfMyRewardChanges) ||
    !isBoolean(notifyOfPointChanges)
  ) {
    response.sendStatus(400);
    return;
  }

  const updatedUser = await updateUserNotificationSettings(
    userId,
    notifyOfNewBusinesses,
    notifyOfMyRewardChanges,
    notifyOfPointChanges,
    coordinateLatitude,
    coordinateLongitude,
    zipCode
  );

  response.sendStatus(201);
};

export const getNotificationSettings = async (
  request: Request,
  response: Response
) => {
  console.log("inside getNotificationSettings");

  const { userId } = request.params;

  if (!userId) {
    response.status(400);
    response.end();
    return;
  }

  const appUser = await getUserNotificationSettings(userId);

  if (appUser) {
    response.send(appUser);
  } else {
    response.sendStatus(400);
  }
};

export const getEnrolledAndPendingLoyalty = async (
  request: Request,
  response: Response
) => {
  console.log("inside getEnrolledAndPendingLoyalty");

  const { userId } = request.params;

  if (!userId) {
    response.status(400);
    response.end();
    return;
  }

  const allLoyaltyAccounts = await getAllLoyaltyAccounts(userId);

  if (allLoyaltyAccounts) {
    response.send(allLoyaltyAccounts);
  } else {
    response.status(400);
  }
  response.end();
};

const getLoyalty = async (request: Request, response: Response) => {
  console.log("inside getLoyalty");

  const { businessId } = request.query;

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

  const userLoyalty = await getUserLoyaltyDetails(businessId as string, userId);

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

  const { countryCode, phoneNumber } = request.body;

  if (!countryCode || !phoneNumber) {
    response.status(400);
    return;
  }

  //   await sendSMSVerification(countryCode, phoneNumber, businessId);
  const status = await sendSMSVerification(countryCode, phoneNumber);

  if (status && status == "pending") {
    response.status(200);
  } else {
    response.status(400);
  }
  response.end();
};

const verifyUserCode = async (request: Request, response: Response) => {
  console.log("inside verifyCode");

  const { countryCode, phoneNumber, code } = request.body;

  if (!countryCode || !phoneNumber || !code) {
    response.status(400);
    response.end();
    return;
  }

  console.log(
    "countryCode: " +
      countryCode +
      ", phoneNumber: " +
      phoneNumber +
      ", code: " +
      code
  );

  const appUser = await verifyCodeIsValid(countryCode, phoneNumber, code);

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
  addFavorite,
  deleteFavorite,
  getDetails,
  getEnrolledAndPendingLoyalty,
  getFavorites,
  getLoyalty,
  getNotificationSettings,
  requestUserPhoneNumberVerification,
  updateBusinessNotificationSettings,
  updateDetails,
  updateNotificationSettings,
  verifyUserCode,
};
