import { createAppLoyaltyFromLoyaltyProgram } from "./LoyaltyService";
import { decryptToken } from "./EncryptionService";
import {
  getMerchantInfo,
  getMainLoyaltyProgramFromMerchant,
  getMerchantLocation,
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
import {
  paginateResponse,
  paginateResponseWithoutTotal,
} from "../utility/Utility";
import { Equal, Point, QueryFailedError } from "typeorm";
import exp from "constants";
import { error } from "console";
import { off } from "process";

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

export const searchBusiness = async (
  latitude: number,
  longitude: number,
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
) => {
  console.log("inside searchBusiness");

  const limit = pageSize || 10;
  const page = pageNumber || 1;
  const offset = (page - 1) * limit;

  var selectClause = `SELECT "id", "name", "businessName", "description", "addressLine1", "addressLine2", "city", "state", "zipCode", "phoneNumber", "hoursOfOperation", "businessEmail", "businessId", "merchantLocationId", "isLoyaltyActive", "showLoyaltyInApp", "showPromotionsInApp", "firstImageUrl", "secondImageUrl", "logoUrl", "fullFormatLogoUrl", ST_ASTEXT("locationPoint") AS locationPoint, "timezone", ST_Distance(ST_MakePoint(${longitude}, ${latitude} )::geography, "locationPoint"::geography) / 1600 AS distance FROM location WHERE "status" = \'ACTIVE\' AND "showThisLocationInApp" = true `;

  if (searchTerm) {
    selectClause += ' AND "businessName" ILIKE \'%' + searchTerm + "%'";
  }
  selectClause += " ORDER BY distance LIMIT ";

  // try {
  const data = await Location.query(
    selectClause + limit + " offset " + offset + ";"
  );
  // return data;
  return paginateResponseWithoutTotal(data, page, limit);
  // return paginateResponse(data, page, limit);
  // } catch {
  //   console.log("Error thrown while getting nearby businesses: " + error);
  //   return null;
  // }
};

export const getActiveLocationsForBusinessId = async (
  businessId: string,
  pageNumber: number,
  pageSize: number
) => {
  console.log("inside getLocationsForBusinessId");

  try {
    const business = await Business.createQueryBuilder("business")
      .where("business.businessId = :businessId", { businessId: businessId })
      .getOne();

    if (!business) {
      console.log("Can't find Business for businessId: " + businessId);
      return false;
    }
    const take = pageSize || 10;
    const page = pageNumber || 1;
    const skip = (page - 1) * take;

    const data = await Location.findAndCount({
      where: { businessId: Equal(businessId), status: Equal("ACTIVE") },
      // .andWhere("business.status = :status", { status: "ACTIVE" })

      order: { name: "ASC" },
      take: take,
      skip: skip,
    });

    return paginateResponse(data, page, take);
  } catch (error) {
    console.log("Error thrown while getting locations");
    return null;
  }
};

export const updateLocationSettingsAndImages = async (
  locationId: string,
  showThisLocationInApp: boolean,
  showLoyaltyInApp: boolean,
  showPromotionsInApp: boolean,
  firstImageUrl?: string,
  secondImageUrl?: string
) => {
  console.log("inside updateLocation");

  try {
    const location = await Location.createQueryBuilder("location")
      .where("location.id = :locationId", { locationId: locationId })
      .getOne();
    if (!location) {
      return false;
    }
    console.log(
      "firstImageUrl:" + firstImageUrl + ", secondImageUrl:" + secondImageUrl
    );
    await AppDataSource.manager.update(
      Location,
      {
        id: locationId,
      },
      {
        showThisLocationInApp: showThisLocationInApp,
        showLoyaltyInApp: showLoyaltyInApp,
        showPromotionsInApp: showPromotionsInApp,
        firstImageUrl: firstImageUrl ?? null,
        secondImageUrl: secondImageUrl ?? null,
      }
    );
    console.log("location sucessfully updated");
    return true;
  } catch (error) {
    console.log("Error thrown while updating location: " + error);
    return false;
  }
};

export const updateLocationsWithLoyaltySettings = async (
  businessId: string,
  merchantLocationIds: string[]
) => {
  console.log("creating new business");

  try {
    const locations = await Location.createQueryBuilder("location")
      .where("location.businessId = :businessId", { businessId: businessId })
      .getMany();

    if (!locations) {
      return false;
    }
    for (var location of locations) {
      var isLoyaltyActive = false;
      for (var merchantLocationId of merchantLocationIds) {
        if (merchantLocationId == location.merchantLocationId) {
          // no change, so skip update
          isLoyaltyActive = true;
        }
      }
      // Hide loyalty when inactive, otherwise keep existing setting. If loyalty is active and show in app
      // not set yet, default it to true
      const showLoyaltyInApp =
        isLoyaltyActive == false
          ? false
          : location.showLoyaltyInApp == undefined
          ? true
          : location.showLoyaltyInApp;
      await AppDataSource.manager.update(
        Location,
        {
          businessId: businessId,
          merchantLocationId: location.merchantLocationId,
        },
        {
          showLoyaltyInApp: showLoyaltyInApp,
          isLoyaltyActive: isLoyaltyActive,
        }
      );
    }
    return true;
  } catch (error) {
    console.log("Error thrown while updating location: " + error);
    return false;
  }
};

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

const createLocationHours = (businessHourPeriods: BusinessHoursPeriod[]) => {
  console.log("inside createLocationHours");
  var hours:
    | [
        {
          dayOfWeek: string;
          startLocalTime: string;
          endLocalTime: string;
        }
      ]
    | undefined;

  var jsonPeriods = [];
  for (var period of businessHourPeriods) {
    if (period.dayOfWeek && period.startLocalTime && period.endLocalTime) {
      var periodJson = {
        dayOfWeek: period.dayOfWeek,
        startLocalTime: period.startLocalTime,
        endLocalTime: period.endLocalTime,
      };
      jsonPeriods.push(periodJson);
    }
  }
  return jsonPeriods;
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
    // var hours:
    //   | {
    //       dayOfWeek: string;
    //       startLocalTime: string;
    //       endLocalTime: string;
    //     }[]
    //   | undefined;

    let hours:
      | { dayOfWeek: string; startLocalTime: string; endLocalTime: string }[]
      | undefined;
    if (merchantLocation.businessHours?.periods) {
      hours = createLocationHours(merchantLocation.businessHours.periods);
    } else {
      hours = undefined;
    }

    // if (merchantLocation.businessHours?.periods) {
    //   var jsonPeriods = [];
    //   for (var period of merchantLocation.businessHours.periods) {
    //     if (period.dayOfWeek && period.startLocalTime && period.endLocalTime) {
    //       var periodJson = {
    //         dayOfWeek: period.dayOfWeek,
    //         startLocalTime: period.startLocalTime,
    //         endLocalTime: period.endLocalTime,
    //       };
    //       jsonPeriods.push(periodJson);
    //     }
    //   }
    //   hours = jsonPeriods;
    // } else {
    //   hours = undefined;
    // }
    let locationPoint: Point | undefined;
    if (
      merchantLocation.coordinates?.longitude &&
      merchantLocation.coordinates.latitude
    ) {
      locationPoint = {
        type: "Point",
        coordinates: [
          merchantLocation.coordinates?.longitude,
          merchantLocation.coordinates?.latitude,
        ],
      };
    }
    await insertBusinessLocation(
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
      merchantLocation.businessEmail,
      locationPoint,
      merchantLocation.timezone ?? "America/Los_Angeles",
      merchantLocation.logoUrl,
      merchantLocation.fullFormatLogoUrl
    );
  }
};

export const updateBusinessLocationFromWebhook = async (
  merchantId: string,
  merchantLocationId: string,
  updateType: string
) => {
  console.log("inside updateBusinessLocationFromWebhook");

  const business = await Business.createQueryBuilder("business")
    .where("business.merchantId = :merchantId", { merchantId: merchantId })
    .getOne();

  if (!business) {
    console.log("Can't find Business for merchantId: " + merchantId);
    return false;
  }

  const token = decryptToken(business.merchantAccessToken);

  if (!token) {
    console.log("Can't get token");
    return false;
  }

  const merchantLocation = await getMerchantLocation(merchantLocationId, token);
  if (!merchantLocation) {
    console.log("Could not find merchant location");
    return;
  }

  // let xx = merchantLocation.locationPoint.coordinates

  let hours:
    | { dayOfWeek: string; startLocalTime: string; endLocalTime: string }[]
    | undefined;
  if (merchantLocation.businessHours?.periods) {
    hours = createLocationHours(merchantLocation.businessHours.periods);
  }

  let locationPoint: Point | undefined;

  // if (
  //   merchantLocation.coordinates?.longitude &&
  //   merchantLocation.coordinates.latitude
  // ) {
  locationPoint = {
    type: "Point",
    coordinates: [
      -122.465683, 37.7407,
      // 37.7407, -122.465683,
      // -122.47649, 37.72638,
      // merchantLocation.coordinates?.longitude,
      // merchantLocation.coordinates?.latitude,
    ],
  };
  // }

  if (updateType == "create") {
    const newLocation = await insertBusinessLocation(
      business.businessId,
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
      merchantLocation.businessEmail,
      locationPoint,
      merchantLocation.timezone ?? "America/Los_Angeles",
      merchantLocation.logoUrl,
      merchantLocation.fullFormatLogoUrl
    );
    if (newLocation) {
      return true;
    }
  }
  // Either it's an update for insert failed. Either way we'll try to update it
  const status = await updateBusinessLocation(
    business.businessId,
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
    merchantLocation.businessEmail,
    locationPoint,
    merchantLocation.timezone ?? "America/Los_Angeles",
    merchantLocation.logoUrl,
    merchantLocation.fullFormatLogoUrl
  );
  console.log("");
  return status;
};

const updateBusinessLocation = async (
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
  businessEmail?: string | null | undefined,
  locationPoint?: Point | undefined,
  timezone?: string | undefined,
  logUrl?: string | undefined,
  fullFormatLogoUrl?: string | undefined
) => {
  console.log(
    "inside updateBusinessLocation with merchantLocationId: " +
      merchantLocationId +
      ", businessId: " +
      businessId +
      ", locationPoint: " +
      locationPoint?.coordinates
  );

  try {
    const result = await AppDataSource.manager.update(
      Location,
      {
        businessId: businessId,
        merchantLocationId: merchantLocationId,
      },
      {
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
        locationPoint: locationPoint,
        timezone: timezone ?? "America/Los_Angeles",
        logoUrl: logUrl,
        fullFormatLogoUrl: fullFormatLogoUrl,
      }
    );
    if (result.affected == 0) {
      // Location not found for some reason, so insert it
      const newLoc = await insertBusinessLocation(
        businessId,
        merchantLocationId,
        status,
        name,
        businessName,
        description,
        addressLine1,
        addressLine2,
        city,
        state,
        zipCode,
        country,
        phoneNumber,
        hoursOfOperation,
        businessEmail,
        locationPoint,
        timezone ?? "America/Los_Angeles",
        logUrl,
        fullFormatLogoUrl
      );
      console.log("location was created");
      return newLoc != null;
    } else {
      console.log("location update was successful");
      return true;
    }
    return true;
  } catch (error) {
    console.log("Error was thrown while updating location: " + error);
    return false;
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
  businessEmail?: string | null | undefined,
  locationPoint?: Point | undefined,
  timezone?: string,
  logUrl?: string | undefined,
  fullFormatLogoUrl?: string | undefined
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
      showThisLocationInApp: status == "ACTIVE",
      locationPoint: locationPoint,
      timezone: timezone,
      logoUrl: logUrl,
      fullFormatLogoUrl: fullFormatLogoUrl,
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
  getActiveLocationsForBusinessId,
  updateBusinessDetails,
  updateBusinessEntity,
  updateBusinessLocationFromWebhook,
  updateLocationSettingsAndImages,
  updateLocationsWithLoyaltySettings,
  findBusinessByMerchantId,
  searchBusiness,
};
