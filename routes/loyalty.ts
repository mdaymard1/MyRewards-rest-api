import { EntityManager } from "typeorm";
import { Request, Response } from "express";
import { AppDataSource } from "../appDataSource";
import { Business } from "../src/entity/Business";
import { CustomRequest } from "../src/middleware/checkJwt";
import { Loyalty } from "../src/entity/Loyalty";
import { getMainLoyaltyProgramFromMerchant } from "../src/services/MerchantService";
import { getBusinessIdFromAuthToken } from "../src/services/BusinessService";
import { decryptToken } from "../src/services/EncryptionService";
import {
  createAppLoyaltyFromLoyaltyProgram,
  createEnrollmentRequest,
  enrollCustomerInLoyalty,
  isLoyaltyOrPromotionsOutOfDate,
  updateAppLoyaltyFromMerchant,
  LoyaltyStatusType,
  updateLoyaltyItems,
  updateLoyaltyStatuses,
  deleteRequestedEnrollment,
  enrollRequestIntoLoyalty,
  getPaginatedCustomers,
  getPaginatedEnrollmentRequests,
  EnrollmentSourceType,
} from "../src/services/LoyaltyService";
import { LoyaltyProgram, LoyaltyPromotion } from "square";

export const getEnrollmentRequests = async (
  request: Request,
  response: Response
) => {
  console.log("inside getEnrollmentRequests");

  const businessId = await getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(401);
    response.end();
    return;
  }

  const { pageNumber, pageSize } = request.query;

  const page = Number(pageNumber);
  const size = Number(pageSize);

  console.log("pageNumber: " + pageNumber + ", page: " + page);
  console.log("pageSize: " + pageSize + ", size: " + size);

  const results = await getPaginatedEnrollmentRequests(businessId, page, size);
  // console.log('results: ' + results);
  response.send(results);
};

export const getCustomers = async (request: Request, response: Response) => {
  console.log("inside getCustomers");

  const businessId = await getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(401);
    response.end();
    return;
  }
  const { pageNumber, pageSize } = request.query;

  const page = Number(pageNumber);
  const size = Number(pageSize);

  console.log("pageNumber: " + pageNumber + ", page: " + page);
  console.log("pageSize: " + pageSize + ", size: " + size);

  const results = await getPaginatedCustomers(businessId, page, size);
  response.send(results);
};

export const enrollRequest = async (request: Request, response: Response) => {
  console.log("inside enrollRequest ");

  const businessId = await await getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(401);
    response.end();
    return;
  }

  try {
    const business = await Business.createQueryBuilder("business")
      .select(["business.merchantAccessToken"])
      .where("business.businessId = :businessId", {
        businessId: businessId,
      })
      .getOne();

    if (!business) {
      response.status(404);
      response.end();
      return;
    }

    const { enrollmentRequestId } = request.params;
    const { locationId } = request.query;

    if (!locationId) {
      response.status(404);
      response.end();
      return;
    }

    var token: string | undefined = "";
    token = decryptToken(business.merchantAccessToken);

    if (token) {
      const wasSuccessful = await enrollRequestIntoLoyalty(
        businessId,
        token,
        enrollmentRequestId,
        locationId as string
      );
      response.status(wasSuccessful ? 200 : 400);
      response.end();
    } else {
      response.status(400);
      response.end();
    }
  } catch (error) {
    console.log("Error thrown while getting merchantId from token");
  }
};

export const deleteEnrollmentRequest = async (
  request: Request,
  response: Response
) => {
  console.log("inside deleteEnrollmentRequest");

  const businessId = await getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(401);
    response.end();
    return;
  }

  const { enrollmentRequestId } = request.params;

  let wasDeleteSuccessful = await deleteRequestedEnrollment(
    enrollmentRequestId
  );

  response.status(wasDeleteSuccessful ? 200 : 400);
  response.end();
};

const requestEnrollment = async (request: Request, response: Response) => {
  console.log("inside requestEnrollment");

  const {
    businessId,
    appUserId,
    locationId,
    firstName,
    lastName,
    phone,
    email,
  } = request.body;

  console.log(
    "received input of " +
      "appUserId: " +
      appUserId +
      " locationId: " +
      locationId +
      " firstName: " +
      firstName +
      " lastName: " +
      lastName +
      " email" +
      email +
      " phone: " +
      phone +
      " businessId: " +
      businessId
  );

  if (!businessId || !appUserId || !locationId || !firstName || !phone) {
    console.log("missing fields");
    response.status(400);
    response.end();
    return;
  }

  const newEnrollmentId = await createEnrollmentRequest(
    businessId,
    locationId,
    appUserId,
    firstName,
    lastName,
    phone,
    email
  );

  response.status(newEnrollmentId ? 201 : 400);
  response.end();
};

const enrollCustomer = async (request: Request, response: Response) => {
  console.log("inside enrollCustomer");

  const {
    businessId,
    appUserId,
    locationId,
    firstName,
    lastName,
    phone,
    email,
  } = request.body;

  console.log(
    "received input of " +
      appUserId +
      " " +
      locationId +
      " " +
      firstName +
      " " +
      lastName +
      " +" +
      phone +
      ", " +
      email +
      ", businessId:" +
      businessId
  );

  if (!appUserId || !locationId || !firstName || !phone || !businessId) {
    console.log("missing fields");
    response.status(400);
    response.end();
    return;
  }

  try {
    const business = await Business.createQueryBuilder("business")
      .select(["business.merchantAccessToken"])
      .where("business.businessId = :businessId", {
        businessId: businessId,
      })
      .getOne();
    if (!business) {
      response.status(404);
      response.end();
      return;
    }

    var token: string | undefined = "";
    token = decryptToken(business.merchantAccessToken);

    if (token) {
      await enrollCustomerInLoyalty(
        businessId,
        appUserId,
        token,
        EnrollmentSourceType.RewardsApp,
        locationId,
        phone,
        firstName,
        lastName,
        email
      );
      response.status(201);
      response.end();
    }
  } catch (error) {
    console.log("Error thrown while enrolling customer in loyalty");
  }
};

const getLoyalty = async (request: Request, response: Response) => {
  console.log("inside getLoyalty");

  const businessId = await getBusinessIdFromAuthToken(request);
  console.log("merchantId: " + businessId);

  if (!businessId) {
    response.status(401);
    response.end();
    return;
  }

  try {
    const business = await Business.createQueryBuilder("business")
      .select(["business.merchantAccessToken"])
      .where("business.businessId = :businessId", {
        businessId: businessId,
      })
      .getOne();

    if (!business) {
      response.status(404);
      response.end();
      return;
    }

    const loyalty = await AppDataSource.manager.findOne(Loyalty, {
      where: {
        businessId: business.businessId,
      },
    });

    var token: string | undefined = "";
    token = decryptToken(business.merchantAccessToken);
    if (token) {
      const loyaltyResponse = await getMainLoyaltyProgramFromMerchant(token);
      console.log(
        "got back program: " +
          loyaltyResponse?.program?.id +
          ", promo count: " +
          loyaltyResponse?.promotions?.length +
          ", accrualType: " +
          loyaltyResponse?.accrualType +
          ", categoryIdMap count: " +
          loyaltyResponse?.catalogItemNameMap?.size
      );

      if (loyaltyResponse?.program) {
        if (loyalty) {
          if (
            isLoyaltyOrPromotionsOutOfDate(
              loyalty,
              loyaltyResponse.program,
              loyaltyResponse?.promotions
            )
          ) {
            console.log("loyalty is out of date");
            const updatedloyalty = await updateAppLoyaltyFromMerchant(
              loyalty,
              loyaltyResponse.program,
              loyaltyResponse?.promotions,
              loyaltyResponse?.catalogItemNameMap
              // function (updatedloyalty: Loyalty) {
            );
            console.log("done updating loyalty");
            if (updatedloyalty) {
              //Get a refreshed loyalty
              console.log("loyalty updated, now getting refreshed version");
              const refreshedLoyalty = await getCurrentLoyaltyById(
                updatedloyalty.id
              );
              if (refreshedLoyalty) {
                response.send(refreshedLoyalty);
              } else {
                response.status(500);
                response.end();
                return;
              }
            }
          } else {
            console.log("loyalty is not out of date");
            response.send(loyalty);
          }
        } else {
          const newLoyalty = await createAppLoyaltyFromLoyaltyProgram(
            business.businessId,
            loyaltyResponse?.program,
            loyaltyResponse?.promotions,
            loyaltyResponse?.catalogItemNameMap
            // function (newLoyalty: Loyalty) {
          );
          if (newLoyalty) {
            getCurrentLoyaltyById(newLoyalty.id);
            if (loyalty) {
              response.send(loyalty);
            } else {
              response.status(500);
              response.end();
              return;
            }
          } else {
            response.status(500);
            response.end();
            return;
          }
        }
      } else {
        // If no merchant loyalty is found, we should probably check app loyalty and remove it
        response.status(404);
        response.end();
      }
    } else {
      //TODO: How do we handle an invalid encrypted token? Need to notifiy someone
    }
  } catch (error) {
    console.log("Error thrown while getting loyalty: " + error);
  }
};

const updateLoyalty = async (request: Request, response: Response) => {
  const { loyaltyId } = request.params;

  const businessId = await getBusinessIdFromAuthToken(request);
  console.log("businessId: " + businessId + ", + loyaltyId " + loyaltyId);

  if (!businessId || !loyaltyId) {
    console.log("missing input");
    response.status(400);
    response.end();
    return;
  }

  const { loyaltyAccruals, promotions, loyaltyRewardTiers } = request.body;

  if (!loyaltyAccruals && !promotions && !loyaltyRewardTiers) {
    response.status(400);
    response.end();
    return;
  }

  const wasSuccessful = await updateLoyaltyItems(
    businessId,
    loyaltyId,
    loyaltyAccruals,
    promotions,
    loyaltyRewardTiers
  );
  response.status(wasSuccessful ? 204 : 404);
  response.end();
};

const updateLoyaltyStatus = async (request: Request, response: Response) => {
  const { loyaltyId } = request.params;

  const businessId = await getBusinessIdFromAuthToken(request);

  console.log("businessId: " + businessId + ", + loyaltyId" + loyaltyId);

  const {
    showLoyaltyInApp,
    showPromotionsInApp,
    automaticallyUpdateChangesFromMerchant,
    loyaltyStatus,
  } = request.body;

  if (!businessId || !loyaltyStatus) {
    console.log("missing input");
    response.status(400);
    response.end();
    return;
  }
  if (
    typeof showLoyaltyInApp != "boolean" ||
    typeof showPromotionsInApp != "boolean" ||
    typeof automaticallyUpdateChangesFromMerchant != "boolean"
  ) {
    console.log("input fields not boolean");
    response.status(400);
    response.end();
    return;
  }

  if (!isValidLoyaltyStatus(loyaltyStatus)) {
    response.status(400);
    response.end();
    return;
  }

  const wasSuccessful = await updateLoyaltyStatuses(
    businessId,
    loyaltyId,
    showLoyaltyInApp,
    showPromotionsInApp,
    automaticallyUpdateChangesFromMerchant,
    loyaltyStatus
  );
  response.status(wasSuccessful ? 204 : 500);
  response.end();
};

function isValidLoyaltyStatus(value: string): value is LoyaltyStatusType {
  return Object.values<string>(LoyaltyStatusType).includes(value);
}

const getCurrentLoyaltyById = async (loyaltyId: string) => {
  const loyalty = await AppDataSource.manager.findOne(Loyalty, {
    where: {
      id: loyaltyId,
    },
  });
  return loyalty;
};

module.exports = {
  deleteEnrollmentRequest,
  enrollCustomer,
  enrollRequest,
  getEnrollmentRequests,
  getCustomers,
  getLoyalty,
  requestEnrollment,
  updateLoyalty,
  updateLoyaltyStatus,
};
