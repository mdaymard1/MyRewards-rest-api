import { createAppLoyaltyFromLoyaltyProgram } from "./LoyaltyService";
import { decryptToken } from "./EncryptionService";
import {
  getMerchantInfo,
  getMainLoyaltyProgramFromMerchant,
  getMerchantLocations,
} from "./MerchantService";
import { Business } from "../entity/Business";
import { Location } from "../entity/Location";
import { Loyalty } from "../entity/Loyalty";
import {
  BusinessHoursPeriod,
  LoyaltyProgram,
  LoyaltyPromotion,
  Merchant,
} from "square";
import { Request, Response } from "express";
import { AppDataSource } from "../../appDataSource";

export function getBusinessIdFromAuthToken(
  request: Request
): string | undefined {
  if (request.headers.authorization) {
    const authValues = request.headers.authorization.split(" ");
    if (authValues.length == 2) {
      const encryptedBusinessIdToken = authValues[1];
      return decryptToken(encryptedBusinessIdToken);
    }
  }
  return undefined;
}

export const createNewBusinessWithLoyalty = async (
  name: string | undefined,
  merchantId: string,
  accessToken: string,
  refreshToken: string,
  expirationDate: Date | undefined,
  callback: any
) => {
  console.log("creating new business");

  try {
    createBusinessFromMerchantInfo(
      name,
      merchantId,
      accessToken,
      refreshToken,
      expirationDate,
      function (newBusiness: Business) {
        if (newBusiness) {
          var token: string | undefined = "";
          token = decryptToken(newBusiness.merchantAccessToken);
          if (token) {
            getMainLoyaltyProgramFromMerchant(
              token,
              function (
                loyaltyProgram: LoyaltyProgram,
                promotions: LoyaltyPromotion[],
                accrualType: string,
                catalogItemNameMap: Map<string, string>
              ) {
                console.log(
                  "got back program: " +
                    loyaltyProgram?.id +
                    ", promo count: " +
                    promotions?.length +
                    ", accrualType: " +
                    accrualType +
                    ", catalogItemNameMap count: " +
                    catalogItemNameMap?.size
                );

                if (loyaltyProgram) {
                  createAppLoyaltyFromLoyaltyProgram(
                    newBusiness.businessId,
                    loyaltyProgram,
                    promotions,
                    catalogItemNameMap,
                    function (newLoyalty: Loyalty) {
                      if (!newLoyalty) {
                        console.log("Failed to create app loyalty");
                      }
                      callback(newBusiness);
                    }
                  );
                } else {
                  // If no merchant loyalty is found, we should probably check app loyalty and remove it
                  console.log("No loyalty program found");
                  callback(newBusiness);
                }
              }
            );
          } else {
            //TODO: How do we handle an invalid encrypted token? Need to notifiy someone
            console.log("No valid token found in newBusiness");
            callback(newBusiness);
          }
        } else {
          console.log("Failed to create new business 2");
          callback(undefined);
        }
      }
    );
  } catch (err) {
    console.log("createNewBusinessWithLoyalty encountered an error: " + err);
    callback(undefined);
  }
};

export const createBusinessFromMerchantInfo = async (
  name: string | undefined,
  merchantId: string,
  accessToken: string,
  refreshToken: string,
  expirationDate: Date | undefined,
  callback: any
) => {
  console.log("inside createBusinessFromMerchantInfo");
  // First, we need to make sure the tokens are valid, so we'll get the latest merchant info first
  const merchant = await getMerchantInfo(merchantId, accessToken);
  if (merchant) {
    console.log("got merchant, calling createBusinessEntity");
    var merchantName: string | undefined = merchant.businessName ?? undefined;
    const business = await createBusinessEntity(
      merchantId,
      merchantName,
      accessToken,
      refreshToken,
      expirationDate
    );
    console.log(
      "returned from createBusinessEntity with business: " + business
    );
    if (business) {
      const wereLocationsCreated = await createBusinessLocations(
        business.businessId,
        merchantId,
        accessToken
      );
      console.log(
        "creation of business locations result: " + wereLocationsCreated
      );
    }
    callback(business);
    return;
  } else {
    console.log("returing empty business");
    callback(undefined);
  }
};

const createBusinessEntity = async (
  merchantId: string,
  merchantName: string | undefined,
  accessToken: string,
  refreshToken: string,
  expirationDate: Date | undefined
) => {
  const business = AppDataSource.manager.create(Business, {
    name: merchantName ?? "unknown",
    businessName: merchantName ?? "unknown",
    merchantId: merchantId,
    merchantAccessToken: accessToken,
    merchantRefreshToken: refreshToken,
    accessTokenExpirationDate: expirationDate,
    loyaltyUsesCatalogItems: false,
    specialsUseCatalogItems: false,
    createDate: new Date(),
    lastUpdateDate: new Date(),
  });
  await AppDataSource.manager.save(business);
  console.log("just created business with id: " + business.businessId);
  return business;
};

const createBusinessLocations = async (
  businessId: string,
  merchantId: string,
  accessToken: string
) => {
  const merchantLocations = await getMerchantLocations(merchantId, accessToken);
  if (!merchantLocations || merchantLocations.length == 0) {
    return false;
  }

  for (var merchantLocation of merchantLocations) {
    var hours:
      | {
          dayOfWeek: string;
          startLocalTime: string;
          endLocalTime: string;
        }[]
      | undefined;

    if (merchantLocation.businessHours?.periods) {
      var jsonPeriods = [];
      for (var period of merchantLocation.businessHours.periods) {
        if (period.dayOfWeek && period.startLocalTime && period.endLocalTime) {
          var periodJson = {
            dayOfWeek: period.dayOfWeek,
            startLocalTime: period.startLocalTime,
            endLocalTime: period.endLocalTime,
          };
          jsonPeriods.push(periodJson);
        }
      }
      hours = jsonPeriods;
    } else {
      hours = undefined;
    }
    insertBusinessLocation(
      businessId,
      merchantLocation.id,
      merchantLocation.status,
      merchantLocation.name,
      merchantLocation.businessName,
      merchantLocation.description,
      merchantLocation.address?.addressLine1,
      merchantLocation.address?.addressLine2,
      merchantLocation.address?.locality,
      merchantLocation.address?.administrativeDistrictLevel1,
      merchantLocation.address?.postalCode,
      merchantLocation.address?.country,
      merchantLocation.phoneNumber,
      hours,
      merchantLocation.businessEmail
    );
  }
};

const insertBusinessLocation = async (
  businessId: string,
  merchantLocationId?: string,
  status?: string,
  name?: string | null | undefined,
  businessName?: string | null | undefined,
  description?: string | null | undefined,
  addressLine1?: string | null | undefined,
  addressLine2?: string | null | undefined,
  city?: string | null | undefined,
  state?: string | null | undefined,
  zipCode?: string | null | undefined,
  country?: string | null | undefined,
  phoneNumber?: string | null | undefined,
  hoursOfOperation?:
    | { dayOfWeek: string; startLocalTime: string; endLocalTime: string }[]
    | undefined,
  businessEmail?: string | null | undefined
) => {
  console.log("inside insertBusinessLocation");

  try {
    const location = AppDataSource.manager.create(Location, {
      businessId: businessId,
      merchantLocationId: merchantLocationId,
      status: status,
      name: name ?? undefined,
      businessName: businessName ?? undefined,
      description: description ?? undefined,
      addressLine1: addressLine1 ?? undefined,
      addressLine2: addressLine2 ?? undefined,
      city: city ?? undefined,
      state: state ?? undefined,
      zipCode: zipCode ?? undefined,
      country: country ?? undefined,
      phoneNumber: phoneNumber ?? undefined,
      hoursOfOperation: hoursOfOperation,
      businessEmail: businessEmail ?? undefined,
      showThisLocationInApp: false,
    });
    await AppDataSource.manager.save(location);
    console.log(
      "just created business location with id: " + location.merchantLocationId
    );
    return location;
  } catch (error) {
    console.log("Errow thrown while creating business location: " + error);
    return null;
  }
};
// const updateBusinessWithBusinessIdToken = async (businessRepository: Repository<Business>, businessId: string, merchantId: string, callback: any) => {
//   // Create business token
//   const businessKey = businessId + "::" + merchantId;
//   const encryptedKey = encryptToken(businessKey);
//   console.log("businessKey: " + businessKey + " encrypted to: " + encryptedKey);
//   if (encryptedKey) {
//     await businessRepository.update(businessId, {
//       businessToken: encryptedKey,
//     })
//     callback(true);
//   } else {
//     // If we can't create a business token, return empty business cause we can't provide a client token
//     callback(false);
//   }
// }

export const updateBusinessEntity = async (
  businessId: string,
  merchantId: string,
  accessToken: string,
  refreshToken: string,
  expirationDate: Date | undefined,
  business: Business,
  callback: any
) => {
  AppDataSource.manager.update(
    Business,
    {
      merchantId: merchantId,
    },
    {
      merchantAccessToken: accessToken,
      merchantRefreshToken: refreshToken,
      accessTokenExpirationDate: expirationDate,
    }
  );
  console.log("just updated business with id: " + business.businessId);
  callback(business);
};

export const updateBusinessDetails = async (
  businessId: string,
  lastUpdateDate: string,
  businessName: string,
  addressLine1?: string,
  addressLine2?: string,
  city?: string,
  state?: string,
  zipCode?: string,
  phone?: string,
  hoursOfOperation?: string,
  businessDescription?: string,
  websiteUrl?: string,
  appStoreUrl?: string,
  googlePlayStoreUrl?: string,
  reviewsUrl?: string,
  firstImageUrl?: string,
  secondImageUrl?: string
): Promise<boolean> => {
  console.log("inside updateBusinessDetails");
  try {
    // First make sure the business does exist
    const business = await Business.createQueryBuilder("business")
      .where("business.businessId = :businessId", { businessId: businessId })
      .getOne();
    if (!business) {
      return false;
    }

    const lastUpdate = new Date(lastUpdateDate);

    console.log(
      "firstImageUrl:" + firstImageUrl + ", secondImageUrl:" + secondImageUrl
    );

    // Now update its values
    AppDataSource.manager.update(
      Business,
      {
        businessId: businessId,
      },
      {
        lastUpdateDate: lastUpdate,
        businessName: businessName,
        addressLine1: addressLine1,
        addressLine2: addressLine2,
        city: city,
        state: state,
        zipCode: zipCode,
        phone: phone,
        hoursOfOperation: hoursOfOperation,
        businessDescription: businessDescription,
        websiteUrl: websiteUrl,
        appStoreUrl: appStoreUrl,
        googlePlayStoreUrl: googlePlayStoreUrl,
        reviewsUrl: reviewsUrl,
        firstImageUrl: firstImageUrl ?? null,
        secondImageUrl: secondImageUrl ?? null,
      }
    );
    return true;
  } catch (err) {
    console.log("Error returned while getting business by id: " + err);
    return false;
  }
};

export const findBusinessByMerchantId = async (
  merchantId: string,
  callback: any
) => {
  console.log("inside findBusinessByMerchantId");

  try {
    const business = await Business.createQueryBuilder("business")
      .where("business.merchantId = :merchantId", { merchantId: merchantId })
      .getOne();
    callback(business);
  } catch (err) {
    callback(undefined);
  }
};

module.exports = {
  createBusinessFromMerchantInfo,
  createNewBusinessWithLoyalty,
  getBusinessIdFromAuthToken,
  updateBusinessDetails,
  updateBusinessEntity,
  findBusinessByMerchantId,
};
