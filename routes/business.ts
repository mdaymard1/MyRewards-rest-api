import { Request, Response } from "express";
import { AppDataSource } from "../appDataSource";
import { Business } from "../src/entity/Business";
import { Location } from "../src/entity/Location";
import {
  createNewBusinessWithLoyalty,
  findBusinessByMerchantId,
  updateBusinessEntity,
  getBusinessIdFromAuthToken,
  updateBusinessDetails,
  updateLocationSettingsAndImages,
  getActiveLocationsForBusinessId,
  searchBusiness,
} from "../src/services/BusinessService";
import { verifyMerchantToken } from "../src/services/MerchantService";
import crypto from "crypto";
import { getLoyaltyForLocation } from "../src/services/LoyaltyService";
import { getSpecialsForLocation } from "../src/services/SpecialService";
import { isBoolean } from "../src/utility/Utility";
import { sign } from "jsonwebtoken";
import config from "../src/config";

const getLocationDetails = async (request: Request, response: Response) => {
  console.log("inside getLocationDetails");

  const { locationId } = request.params;

  if (!locationId) {
    console.log("missing locationid");
    response.status(404);
    response.end();
    return;
  }

  const location = await Location.createQueryBuilder("location")
    .where("location.id = :locationId", { locationId: locationId })
    .getOne();

  if (!location) {
    console.log("Can't find location for id: " + locationId);
    return false;
  }

  var loyalty: any | undefined;
  if (location.showLoyaltyInApp || location.showPromotionsInApp) {
    loyalty = await getLoyaltyForLocation(location.businessId);
  }

  var specials = await getSpecialsForLocation(location.businessId);

  var result = {
    loyalty: loyalty,
    specials: specials,
  };

  response.send(result);

  // if (loyalty) {
  //   response.send(loyalty);
  // }
  response.end();
};

const search = async (request: Request, response: Response) => {
  console.log("inside getLocations");

  const { searchTerm, latitude, longitude, pageNumber, pageSize, appUserId } =
    request.query;

  console.log("latitude:" + latitude + ", longitude: " + longitude);

  if (!latitude || !longitude) {
    console.log("missing coordinates");
    response.status(400);
    response.end();
    return;
  }

  if (!isLatitude(latitude)) {
    console.log("invalid latitude");
    response.status(400);
    response.end();
  }
  if (!isLongitude(longitude)) {
    console.log("invalid longitude");
    response.status(400);
    response.end();
  }

  const page = Number(pageNumber);
  const size = Number(pageSize);
  const lat = Number(latitude);
  const long = Number(longitude);
  const searchPhrase: string | undefined = searchTerm as string;
  const userId: string | undefined = appUserId as string;

  console.log(
    "searchTerm: " +
      searchTerm +
      ", searchPhrase: " +
      searchPhrase +
      ", appUserId: " +
      userId
  );

  const results = await searchBusiness(
    lat,
    long,
    page,
    size,
    searchPhrase,
    userId
  );
  if (results) {
    console.log("results:" + results);
    response.send(results);
  } else {
    response.status(400);
  }
  response.end();
};

function isLatitude(lat: any) {
  return isFinite(lat) && Math.abs(lat) <= 90;
}

function isLongitude(lng: any) {
  return isFinite(lng) && Math.abs(lng) <= 180;
}

const getLocations = async (request: Request, response: Response) => {
  console.log("inside getLocations");

  const businessId = await getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(400);
    return;
  }

  const { pageNumber, pageSize } = request.query;

  const page = Number(pageNumber);
  const size = Number(pageSize);

  console.log("pageNumber: " + pageNumber + ", page: " + page);
  console.log("pageSize: " + pageSize + ", size: " + size);

  const locations = await getActiveLocationsForBusinessId(
    businessId,
    page,
    size
  );

  if (locations) {
    response.send(locations);
  } else {
    response.status(400);
    response.end();
  }
};

const updateLocation = async (request: Request, response: Response) => {
  console.log("inside updateLocation");

  const businessId = await getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(400);
    response.end();
    return;
  }

  const { locationId } = request.params;

  if (!locationId) {
    console.log("missing locationid");
    response.status(404);
    response.end();
    return;
  }

  const {
    showThisLocationInApp,
    showLoyaltyInApp,
    showPromotionsInApp,
    firstImageUrl,
    secondImageUrl,
  } = request.body;

  if (
    !isBoolean(showLoyaltyInApp) ||
    !isBoolean(showThisLocationInApp) ||
    !isBoolean(showPromotionsInApp)
  ) {
    console.log("missing fields");
    response.status(401);
    response.end();
    return;
  }

  const wasUpdated = await updateLocationSettingsAndImages(
    locationId,
    showThisLocationInApp,
    showLoyaltyInApp,
    showPromotionsInApp,
    firstImageUrl,
    secondImageUrl
  );

  response.status(wasUpdated ? 200 : 400);
  response.end();
};

const getBusiness = async (request: Request, response: Response) => {
  // const key = 'f7fbba6e0636f890e56fbbf3283e524c';
  // const encryptionIV = 'd82c4eb5261cb9c8';
  // const algorithm = 'aes-256-cbc';
  // const cipher = crypto.createCipheriv(
  //   algorithm,
  //   Buffer.from(key),
  //   encryptionIV,
  // );
  // let encrypted = cipher.update(
  //   '2b39f4e9-6ce9-4acf-bc4f-70a8b4ad9e3f',
  //   'utf8',
  //   'base64',
  // );
  // encrypted += cipher.final('base64');
  // console.log('encrypted: ' + encrypted.toString('hex'));
  // // return encrypted.toString("hex");

  // const encoded: string = Buffer.from(
  //   'EAAAEYQN7Eyq8Zx5TKdvij2iMg1wx7IqZWbwjPwzMIrFjcTeKSLTMWU0KmC2aTN_',
  //   'utf8',
  // ).toString('base64');
  // const encryptedKey = encryptToken(
  //   'EAAAEYQN7Eyq8Zx5TKdvij2iMg1wx7IqZWbwjPwzMIrFjcTeKSLTMWU0KmC2aTN_',
  // );

  const businessId = await getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(400);
    return;
  }

  const business = await Business.createQueryBuilder("business")
    .select([
      "business.businessId",
      "business.lastUpdateDate",
      "business.businessName",
      "business.addressLine1",
      "business.addressLine2",
      "business.city",
      "business.state",
      "business.zipCode",
      "business.phone",
      "business.hoursOfOperation",
      "business.businessDescription",
      "business.websiteUrl",
      "business.appStoreUrl",
      "business.googlePlayStoreUrl",
      "business.reviewsUrl",
      "business.firstImageUrl",
      "business.secondImageUrl",
    ])
    .where("business.businessId = :businessId", { businessId: businessId })
    .getOne();

  if (!business) {
    response.status(404);
    response.end();
    return;
  }
  response.send(business);
};

const createTestBusiness = async (request: Request, response: Response) => {
  console.log("inside createTestBusiness");

  const { merchantId, accessToken, refreshToken, expirationDate } =
    request.body;

  var date: Date | undefined;
  console.log("expirationDate: " + expirationDate);
  if (expirationDate) {
    date = new Date(expirationDate);
  }

  const newBusiness = await createNewBusinessWithLoyalty(
    undefined,
    merchantId,
    accessToken,
    refreshToken,
    expirationDate
  );

  if (newBusiness?.businessId) {
    var businessResponse = Object();
    businessResponse.id = newBusiness.businessId;
    response.send(businessResponse);
    // return;
  } else {
    response.sendStatus(500);
    // return;
  }
};

const createBusiness = async (request: Request, response: Response) => {
  console.log("inside createBusiness");

  const { merchantId, accessToken, refreshToken, expirationDate } =
    request.body;

  var businessId: string | undefined = undefined;
  var encryptedBusinessIdToken: string | undefined;

  try {
    businessId = await getBusinessIdFromAuthToken(request);
  } catch (error) {
    console.log("handling missing businessId");
  }

  console.log("businessId: " + businessId);
  console.log("accessToken: " + accessToken);
  console.log("refreshToken: " + refreshToken);

  var date: Date | undefined;
  console.log("expirationDate: " + expirationDate);
  if (expirationDate) {
    date = new Date(expirationDate);
  }

  if (businessId) {
    const business = await AppDataSource.manager.findOne(Business, {
      where: {
        businessId: businessId,
      },
    });
    if (business) {
      console.log("found business");
      // Business found, so update it with the latest tokens and exp date
      const updatedBusiness = await updateBusinessEntity(
        businessId,
        merchantId,
        accessToken,
        refreshToken,
        expirationDate,
        business
      );
      if (updatedBusiness) {
        const newToken = await generateJwt(updatedBusiness);
        if (newToken) {
          response.send({ token: newToken });
        }
        response.sendStatus(500);
      } else {
        response.sendStatus(500);
        return;
      }
    } else {
      // This should never happen where an auth token is passed with business id, but no corresponding business is found
      // If it does, the client should remove their businessId and resubmit
      response.sendStatus(404);
      return;
    }
  } else if (merchantId) {
    const isTokenValid = await verifyMerchantToken(merchantId, accessToken);
    if (isTokenValid) {
      // lookup business by merchantId. If it's already been created, update it with the latest tokens and exp date
      const business = await findBusinessByMerchantId(merchantId);
      if (business) {
        console.log("Found business for merchantId");
        const updatedBusiness = await updateBusinessEntity(
          business.businessId,
          merchantId,
          accessToken,
          refreshToken,
          expirationDate,
          business
        );
        if (updatedBusiness?.businessId) {
          const newToken = await generateJwt(business);
          if (newToken) {
            response.send({ token: newToken });
            return;
          }
        }
        response.sendStatus(500);
      } else {
        const newBusiness = await createNewBusinessWithLoyalty(
          undefined,
          merchantId,
          accessToken,
          refreshToken,
          expirationDate
        );
        if (newBusiness) {
          const newToken = await generateJwt(newBusiness);
          if (newToken) {
            response.send({ token: newToken });
            return;
          }
        }
        response.sendStatus(500);
      }
    } else {
      response.sendStatus(401);
    }
  } else {
    // No businessId or merchantId passed, so we can't look anything up to create or update a business
    response.send(401);
  }
};

const generateJwt = async (business: Business) => {
  try {
    // Generate and sign a JWT that is valid for one hour.
    const token = sign(
      {
        merchantId: business.merchantId,
        username: business.businessName,
      },
      config.jwt.secret!,
      {
        expiresIn: "1h",
        notBefore: "0", // Cannot use before now, can be configured to be deferred.
        algorithm: "HS256",
        audience: config.jwt.audience,
        issuer: config.jwt.issuer,
      }
    );
    return token;
  } catch (error) {
    return null;
  }
};

const updateBusiness = async (request: Request, response: Response) => {
  console.log("inside updateBusiness");

  const businessId = await getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.sendStatus(404);
    return;
  }

  const {
    id,
    lastUpdateDate,
    businessName,
    addressLine1,
    addressLine2,
    city,
    state,
    zipCode,
    phone,
    hoursOfOperation,
    businessDescription,
    websiteUrl,
    appStoreUrl,
    googlePlayStoreUrl,
    reviewsUrl,
    firstImageUrl,
    secondImageUrl,
  } = request.body;

  if (!businessName || !lastUpdateDate) {
    response.sendStatus(400);
    return;
  }

  console.log("businessId: " + businessId);

  console.log(
    "firstImageUrl:" + firstImageUrl + ", secondImageUrl:" + secondImageUrl
  );

  const wasUpdated: boolean = await updateBusinessDetails(
    businessId,
    lastUpdateDate,
    businessName,
    addressLine1,
    addressLine2,
    city,
    state,
    zipCode,
    phone,
    hoursOfOperation,
    businessDescription,
    websiteUrl,
    appStoreUrl,
    googlePlayStoreUrl,
    reviewsUrl,
    firstImageUrl,
    secondImageUrl
  );
  response.status(wasUpdated ? 203 : 500);
  response.end();
};

module.exports = {
  createBusiness,
  createTestBusiness,
  getBusiness,
  getLocationDetails,
  getLocations,
  updateBusiness,
  updateLocation,
  search,
};
