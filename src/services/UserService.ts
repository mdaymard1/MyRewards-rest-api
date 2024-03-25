import { obsfucatePhoneNumber } from "../utility/Utility";
import { AppDataSource } from "../../appDataSource";
import { AppUser } from "../entity/AppUser";
import { Business } from "../entity/Business";
import { Customer } from "../entity/Customer";
import { Loyalty } from "../entity/Loyalty";
import { getAvailableRewardsForLoyaltyBalance } from "./MerchantService";
import { LoyaltyRewardTier } from "../entity/LoyaltyRewardTier";
import exp from "constants";

export const getAllLoyaltyAccounts = async (userId: string) => {
  console.log("inside getAllLoyaltyAccounts");

  try {
    const customerAccounts = await AppUser.createQueryBuilder("appUser")
      .innerJoinAndSelect("appUser.customer", "customer")
      .where("appUser.id = :id", { id: userId })
      .getMany();

    return customerAccounts;
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

    const appUser = await AppUser.createQueryBuilder("appUser")
      .innerJoinAndSelect("appUser.customer", "customer")
      .where("appUser.id = :id", { id: userId })
      .andWhere("customer.businessId = :businessId", { businessId: businessId })
      .getOne();
    if (appUser) {
      const rewardDetails = getAvailableRewardsForLoyaltyBalance(
        appUser.customer.balance,
        loyaltyRewardTiers
      );

      const userLoyalty = {
        id: appUser.id,
        balance: appUser.customer.balance,
        lifetimePoints: appUser.customer.lifetimePoints,
        enrolledAt: appUser.customer.enrolledAt,
        terminologyOne: loyalty.terminologyOne,
        terminologyMany: loyalty.terminologyMany,
        businessId: appUser.customer.business,
        locationId: appUser.customer.locationId,
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
  phoneNumber: string,
  businessId: string
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
  businessId: string,
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
        AppUser,
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
    const newAppUser = AppDataSource.manager.create(AppUser, {
      ref: ref,
      createDate: currentDate,
      lastUpdateDate: currentDate,
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
    const appUser = await AppUser.createQueryBuilder("appUser")
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

  try {
    await AppDataSource.manager.update(
      AppUser,
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
  } catch (error) {
    console.log("got error when updating user:" + error);
    return null;
  }
};

module.exports = {
  getAllLoyaltyAccounts,
  getUserLoyaltyDetails,
  sendSMSVerification,
  verifyCodeIsValid,
  updateUserWithDetails,
  upsertUser,
};
