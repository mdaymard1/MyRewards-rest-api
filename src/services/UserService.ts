import { obsfucatePhoneNumber } from "../utility/Utility";
import { AppDataSource } from "../../appDataSource";
import { User } from "../entity/User";
import { Business } from "../entity/Business";
import { Customer } from "../entity/Customer";
import { Favorite } from "../entity/Favorite";
import { Loyalty } from "../entity/Loyalty";
import { Location } from "../entity/Location";
import { getAvailableRewardsForLoyaltyBalance } from "./MerchantService";
import { LoyaltyRewardTier } from "../entity/LoyaltyRewardTier";
import exp from "constants";
import { EnrollmentRequest } from "../entity/EnrollmentRequest";
import { Point } from "typeorm";
import { CustomerNotificationPreference } from "../entity/CustomerNotificationPreference";
import { QueryFailedError } from "typeorm";

export const getUserFavorites = async (userId: string, idsOnly: boolean) => {
  console.log("inside getUserFavorite with idsonly");

  if (idsOnly) {
    const favoriteIds = await Favorite.createQueryBuilder("favorite")
      .where("favorite.appUserId = :userId", { userId: userId })
      .getMany();
    return favoriteIds;
  } else {
    const query = `SELECT "favorite"."id" AS "favoriteId", "location"."name" AS "locationName", "location"."businessName" AS "businessName", "location"."description" AS "description", "location"."addressLine1" AS "addressLine1", "location"."addressLine2" AS "addressLine2", "location"."city" AS "city", "location"."state" AS "state", "location"."zipCode" AS "zipCode", "location"."phoneNumber" AS "phoneNumber", "location"."hoursOfOperation" AS "hoursOfOperation", "location"."timezone" AS "timezone", "location"."businessEmail" AS "businessEmail", "location"."isLoyaltyActive" AS "isLoyaltyActive", "location"."showLoyaltyInApp" AS "showLoyaltyInApp", "location"."showPromotionsInApp" AS "showPromotionsInApp", "location"."firstImageUrl" AS "firstImageUrl", "location"."secondImageUrl" AS "secondImageUrl", "location"."logoUrl" AS "logoUrl", "location"."fullFormatLogoUrl" AS "fullFormatLogoUrl", "location"."businessId" AS "businessId", "location"."id" AS "locationId", ST_ASTEXT("locationPoint") as "locationpoint" FROM "favorite" "favorite" INNER JOIN "location" "location" ON "location"."id"="favorite"."locationId" WHERE "favorite"."appUserId" = '${userId}'`;
    const favorites = await Location.query(query);
    return favorites;
  }
};

export const deleteUserFavorite = async (
  userId: string,
  locationId: string
) => {
  console.log("inside deleteUserFavorite");

  await AppDataSource.manager.delete(Favorite, {
    appUserId: userId,
    locationId: locationId,
  });
  return;
};

export const addUserFavorite = async (userId: string, locationId: string) => {
  console.log("inside updateUserBusinessNotificationSettings");

  // Make sure userId is valid
  const user = await User.createQueryBuilder("user")
    .where("user.id = :userId", { userId: userId })
    .getOne();

  if (!user) {
    return false;
  }

  try {
    const favorite = AppDataSource.manager.create(Favorite, {
      appUserId: userId,
      locationId: locationId,
    });
    await AppDataSource.manager.save(favorite);
    if (favorite) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    if (
      error instanceof QueryFailedError &&
      error.message.includes("appUser_locationId_id_UNIQUE")
    ) {
      console.log("Ignoring duplicate favorite error");
      return true;
    }
    return false;
  }
};

export const updateUserBusinessNotificationSettings = async (
  userId: string,
  businessId: string,
  customerId: string,
  notifyOfRewardChanges: boolean,
  notifyOfPromotionChanges: boolean,
  notifyOfSpecialsChanges: boolean
) => {
  console.log("inside updateUserBusinessNotificationSettings");

  const notificationPref =
    await CustomerNotificationPreference.createQueryBuilder("notificationPref")
      .where("notificationPref.appUserId = :userId", { userId: userId })
      .andWhere("notificationPref.businessId = :businessId", {
        businessId: businessId,
      })
      .getOne();

  if (notificationPref) {
    return updateCustomerNotificationPreference(
      notificationPref.id,
      notifyOfRewardChanges,
      notifyOfPromotionChanges,
      notifyOfSpecialsChanges
    );
  } else {
    return insertCustomerNotificationPreference(
      userId,
      businessId,
      customerId,
      notifyOfRewardChanges,
      notifyOfPromotionChanges,
      notifyOfSpecialsChanges
    );
  }
};

export const insertCustomerNotificationPreference = async (
  userId: string,
  businessId: string,
  customerId: string,
  notifyOfRewardChanges: boolean,
  notifyOfPromotionChanges: boolean,
  notifyOfSpecialsChanges: boolean
) => {
  console.log("inside insertCustomerNotificationPreference");
  try {
    const notificationPref = AppDataSource.manager.create(
      CustomerNotificationPreference,
      {
        appUserId: userId,
        businessId: businessId,
        customerId: customerId,
        notifyOfRewardChanges: notifyOfRewardChanges,
        notifyOfPromotionChanges: notifyOfPromotionChanges,
        notifyOfSpecialsChanges: notifyOfSpecialsChanges,
      }
    );
    await AppDataSource.manager.save(notificationPref);
    console.log("notificationPref created");
    return notificationPref;
  } catch (error) {
    // customer pref already exists, so we can ignore this error
    return null;
  }
};

const updateCustomerNotificationPreference = async (
  notificationPrefId: string,
  notifyOfRewardChanges: boolean,
  notifyOfPromotionChanges: boolean,
  notifyOfSpecialsChanges: boolean
) => {
  console.log("inside updateCustomerNotificationPreference");

  const updatedPref = await AppDataSource.manager.update(
    CustomerNotificationPreference,
    {
      id: notificationPrefId,
    },
    {
      notifyOfRewardChanges: notifyOfRewardChanges,
      notifyOfPromotionChanges: notifyOfPromotionChanges,
      notifyOfSpecialsChanges: notifyOfSpecialsChanges,
    }
  );
  return updatedPref;
};

export const getUserDetails = async (userId: string) => {
  console.log("inside getUserDetails");

  const user = await User.createQueryBuilder("appUser")
    .where("appUser.id = :id", { id: userId })
    .getOne();

  var userDetails: UserDetails | undefined;
  if (user?.userDetails) {
    userDetails = JSON.parse(JSON.stringify(user.userDetails)) as UserDetails;
  }
  if (userDetails) {
    const details = {
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      email: userDetails.email,
      notifyOfMyRewardChanges: user?.notifyOfMyRewardChanges,
    };
    return details;
  } else {
    return null;
  }
};

export interface UserDetails {
  firstName: string;
  lastName: string | undefined;
  email: string | undefined;
}

export const updateUserDetails = async (
  userId: string,
  firstName: string,
  lastName?: string,
  email?: string
) => {
  console.log("inside updateUserDetails");

  const user = await User.createQueryBuilder("appUser")
    .where("appUser.id = :id", { id: userId })
    .getOne();

  if (user) {
    return await updateUserWithDetails(user.ref, firstName, lastName, email);
  } else {
    return null;
  }
};
export const updateUserNotificationSettings = async (
  appUserId: string,
  notifyOfNewBusinesses: boolean,
  notifyOfMyRewardChanges: boolean,
  notifyOfPointChanges: boolean,
  coordinateLatitude?: number,
  coordinateLongitude?: number,
  zipCode?: string
) => {
  console.log("inside getUserNotificationSettings");

  var locationPoint: Point | undefined;
  if (coordinateLatitude && coordinateLongitude) {
    locationPoint = {
      type: "Point",
      coordinates: [coordinateLongitude, coordinateLatitude],
    };
  }
  const updatedUser = await AppDataSource.manager.update(
    User,
    {
      id: appUserId,
    },
    {
      notifyOfNewBusinesses: notifyOfNewBusinesses,
      notifyOfMyRewardChanges: notifyOfMyRewardChanges,
      notifyOfPointChanges: notifyOfPointChanges,
      locationPoint: locationPoint,
      zipCode: zipCode,
    }
  );
  return;
};

export const getUserNotificationSettings = async (appUserId: string) => {
  console.log("inside getUserNotificationSettings");

  const appUser = await User.createQueryBuilder("appUser")
    .where("appUser.id = :id", { id: appUserId })
    .getOne();

  var latitude: number | undefined;
  var longitude: number | undefined;
  if (appUser?.locationPoint) {
    var locationPoint: LocationPoint;
    locationPoint = JSON.parse(
      JSON.stringify(appUser.locationPoint)
    ) as LocationPoint;
    if (locationPoint && locationPoint.coordinates.length == 2) {
      latitude = locationPoint.coordinates[1];
      longitude = locationPoint.coordinates[0];
    }
  }
  if (appUser) {
    const settings = {
      latitude: latitude,
      longitude: longitude,
      notifyOfNewBusinesses: appUser.notifyOfNewBusinesses ?? false,
      notifyOfMyRewardChanges: appUser.notifyOfMyRewardChanges ?? false,
      notifyOfPointChanges: appUser.notifyOfPointChanges ?? false,
      zipCode: appUser.zipCode,
    };
    return settings;
  }
  return null;
};

export interface LocationPoint {
  type: string;
  coordinates: number[];
}

export const getAllLoyaltyAccounts = async (userId: string) => {
  console.log("inside getAllLoyaltyAccounts");

  try {
    const enrolledLocations = await Location.query(
      `SELECT "customer"."balance" AS "balance", "customer"."lifetimePoints" AS "lifetimePoints", "customer"."enrolledAt" AS "enrolledAt", "customer"."id" AS "customerId", "location"."businessId", "location"."name" AS "locationName", "location"."businessName" AS "businessName", "location"."description" AS "description", "location"."addressLine1" AS "addressLine1", "location"."addressLine2" AS "addressLine2", "location"."city" AS "city", "location"."state" AS "state", "location"."zipCode" AS "zipCode", "location"."phoneNumber" AS "phoneNumber", "location"."hoursOfOperation" AS "hoursOfOperation", "location"."businessEmail" AS "businessEmail", "location"."isLoyaltyActive" AS "isLoyaltyActive", "location"."showLoyaltyInApp" AS "showLoyaltyInApp", "location"."showPromotionsInApp" AS "showPromotionsInApp", "location"."firstImageUrl" AS "firstImageUrl", "location"."secondImageUrl" AS "secondImageUrl", "location"."logoUrl" AS "logoUrl", "location"."fullFormatLogoUrl" AS "fullFormatLogoUrl", ST_ASTEXT("locationPoint") AS locationPoint, "location"."timezone" AS "timezone", "location"."timezone" AS "timezone", "location"."id" AS "locationId", "loyalty"."terminologyOne" as "terminologyOne", "loyalty"."terminologyMany" as "terminologyMany", "customerNotificationPreference"."notifyOfRewardChanges", "customerNotificationPreference"."notifyOfPromotionChanges", "customerNotificationPreference"."notifyOfSpecialsChanges" FROM "customer" "customer" INNER JOIN "location" "location" ON "customer"."locationId" = "location"."id" LEFT OUTER JOIN "loyalty" "loyalty" ON "loyalty"."businessId"
      = "location"."businessId" LEFT OUTER JOIN "customer_notification_preference" "customerNotificationPreference" ON "customerNotificationPreference"."businessId"
      = "location"."businessId" AND "customerNotificationPreference"."customerId" = "customer".id WHERE "customer"."appUserId" = '${userId}'`
    );

    const pendingLocations = await EnrollmentRequest.query(
      `SELECT "enrollmentRequest"."enrollRequestedAt" AS "enrollRequestedAt", "enrollmentRequest"."id" AS "enrollmentRequestId", "location"."businessId", "location"."name" AS "locationName", "location"."businessName" AS "businessName", "location"."description" AS "description", "location"."addressLine1" AS "addressLine1", "location"."addressLine2" AS "addressLine2", "location"."city" AS "city", "location"."state" AS "state", "location"."zipCode" AS "zipCode", "location"."phoneNumber" AS "phoneNumber", "location"."hoursOfOperation" AS "hoursOfOperation", "location"."businessEmail" AS "businessEmail", "location"."isLoyaltyActive" AS "isLoyaltyActive", "location"."showLoyaltyInApp" AS "showLoyaltyInApp", "location"."showPromotionsInApp" AS "showPromotionsInApp", "location"."firstImageUrl" AS "firstImageUrl", "location"."secondImageUrl" AS "secondImageUrl", "location"."logoUrl" AS "logoUrl", "location"."fullFormatLogoUrl" AS "fullFormatLogoUrl", ST_ASTEXT("locationPoint") AS locationPoint, "location"."timezone" AS "timezone", "location"."timezone" AS "timezone", "location"."id" AS "locationId" FROM "enrollment_request" "enrollmentRequest" INNER JOIN "location" "location" ON "enrollmentRequest"."locationId" = "location"."id" WHERE "enrollmentRequest"."appUserid" = '${userId}'`
    );
    return {
      enrolledLocations: enrolledLocations,
      pendingLocations: pendingLocations,
    };
  } catch (error) {
    console.log("Error thrown in getAllLoyaltyAccounts: " + error);
  }
};

export const getUserLoyaltyDetails = async (
  businessId: string,
  userId: string
) => {
  console.log("inside getUserLoyaltyDetails");

  try {
    const loyalty = await Loyalty.createQueryBuilder("loyalty")
      .where("loyalty.businessId = :businessId", { businessId: businessId })
      .getOne();

    if (!loyalty) {
      console.log("loyalty not found");
      return null;
    }

    const loyaltyRewardTiers = await LoyaltyRewardTier.createQueryBuilder(
      "loyaltyRewardTier"
    )
      .where("loyaltyRewardTier.loyaltyId = :loyaltyId", {
        loyaltyId: loyalty.id,
      })
      .getMany();

    const customer = await Customer.createQueryBuilder("customer")
      .where("customer.appUserId = :id", { id: userId })
      .andWhere("customer.businessId = :businessId", { businessId: businessId })
      .getOne();
    if (customer) {
      const rewardDetails = getAvailableRewardsForLoyaltyBalance(
        customer.balance,
        loyaltyRewardTiers
      );

      const userLoyalty = {
        id: customer.appUserId,
        balance: customer.balance,
        lifetimePoints: customer.lifetimePoints,
        enrolledAt: customer.enrolledAt,
        terminologyOne: loyalty.terminologyOne,
        terminologyMany: loyalty.terminologyMany,
        businessId: customer.business,
        locationId: customer.locationId,
        rewardDetails: rewardDetails,
      };
      return userLoyalty;
    } else {
      return null;
    }
  } catch (error) {
    console.log("Error thrown in getUserLoyaltyDetails: " + error);
  }
};

export const updateUserWithDetails = async (
  ref: string,
  firstName?: string,
  lastName?: string,
  email?: string
) => {
  console.log("inside updateUserWithDetails");

  return await updateUser(ref, firstName, lastName, email);
};

export const sendSMSVerification = async (
  countryCode: string,
  phoneNumber: string
) => {
  console.log("inside sendSMSVerification");

  const client = require("twilio")(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    const verify = await client.verify.v2
      .services(process.env.VERIFY_SERVICE_SID)
      .verifications.create({
        to: `${countryCode}${phoneNumber}`,
        channel: "sms",
      });
    return verify.status;
  } catch (error) {
    console.log("Error thrown by verifications.create: " + error);
    return null;
  }
};

export const verifyCodeIsValid = async (
  countryCode: string,
  phoneNumber: string,
  code: string
) => {
  console.log("inside verifyCodeIsValid");

  const client = require("twilio")(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    const verifyCheck = await client.verify.v2
      .services(process.env.VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: `${countryCode}${phoneNumber}`,
        code: `${code}`,
      });
    if (verifyCheck.status == "approved") {
      console.log("verifyCheck status was approved, upserting user");
      const ref = obsfucatePhoneNumber(countryCode + phoneNumber);
      return await upsertUser(ref);
    } else {
      console.log(
        "verifyCheck.status was " + verifyCheck.status + ", not upserting user"
      );
      return null;
    }
  } catch (error) {
    console.log("Error thrown by verificationChecks.create: " + error);
    return null;
  }
};

const upsertUser = async (ref: string) => {
  console.log("inside upsertUser");

  const currentDate = new Date();

  try {
    const appUser = await getAppUserByRef(ref);

    if (appUser) {
      console.log("user already exists, updating last updated date");
      await AppDataSource.manager.update(
        User,
        {
          ref: ref,
        },
        {
          lastUpdateDate: currentDate,
        }
      );
      return appUser;
    }
    // AppUser not found, so create one
    const newAppUser = AppDataSource.manager.create(User, {
      ref: ref,
      createDate: currentDate,
      lastUpdateDate: currentDate,
      notifyOfMyRewardChanges: true,
      notifyOfNewBusinesses: true,
      notifyOfPointChanges: true,
    });
    await AppDataSource.manager.save(newAppUser);
    console.log("user was inserted");
    return newAppUser;
  } catch (error) {
    console.log("got error when inserting user:" + error);
    return null;
  }
};

const getAppUserByRef = async (ref: string) => {
  console.log("inside getAppUserByRef");

  try {
    const appUser = await User.createQueryBuilder("appUser")
      .where("appUser.ref = :ref", {
        ref: ref,
      })
      .getOne();
    console.log("appUser was found");
    return appUser;
  } catch (error) {
    console.log("got error when looking up appUser by ref:" + error);
    return null;
  }
};

const updateUser = async (
  ref: string,
  firstName?: string,
  lastName?: string,
  email?: string
) => {
  console.log("inside updateUser");

  const details = {
    firstName: firstName,
    lastName: lastName,
    email: email,
  };

  const currentDate = new Date();

  await AppDataSource.manager.update(
    User,
    {
      ref: ref,
    },
    {
      userDetails: details,
      lastUpdateDate: currentDate,
    }
  );
  console.log("AppUser details were updated successfully");
  return "success";
};

module.exports = {
  addUserFavorite,
  deleteUserFavorite,
  getAllLoyaltyAccounts,
  getUserDetails,
  getUserFavorites,
  getUserLoyaltyDetails,
  getUserNotificationSettings,
  insertCustomerNotificationPreference,
  sendSMSVerification,
  verifyCodeIsValid,
  updateUserBusinessNotificationSettings,
  updateUserNotificationSettings,
  updateUserDetails,
  updateUserWithDetails,
  upsertUser,
};
