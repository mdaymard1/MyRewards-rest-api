import { EntityManager } from 'typeorm';
import { Request, Response } from 'express';
import { AppDataSource } from '../appDataSource';
import { Business } from '../src/entity/Business';
import { Loyalty } from '../src/entity/Loyalty';
import { getMainLoyaltyProgramFromMerchant } from '../src/services/MerchantService';
import { getBusinessIdFromAuthToken } from '../src/services/BusinessService';
import { decryptToken } from '../src/services/EncryptionService';
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
} from '../src/services/LoyaltyService';
import { LoyaltyProgram, LoyaltyPromotion } from 'square';

export const enrollRequest = async (request: Request, response: Response) => {
  console.log('inside enrollRequest');

  const businessId = getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(401);
    response.end();
    return;
  }

  const business = await AppDataSource.manager.findOne(Business, {
    where: {
      businessId: businessId,
    },
  });

  if (!business) {
    response.status(404);
    response.end();
    return;
  }

  const { enrollmentRequestId } = request.params;

  var token: string | undefined = '';
  token = decryptToken(business.merchantAccessToken);

  const wasSuccessful = await enrollRequestIntoLoyalty(
    businessId,
    token,
    enrollmentRequestId,
  );
  response.status(wasSuccessful ? 200 : 400);
  response.end();
};

export const deleteEnrollmentRequest = async (
  request: Request,
  response: Response,
) => {
  console.log('inside deleteEnrollmentRequest');

  const businessId = getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(401);
    response.end();
    return;
  }

  const { enrollmentRequestId } = request.params;

  let wasDeleteSuccessful = await deleteRequestedEnrollment(
    enrollmentRequestId,
  );

  response.status(wasDeleteSuccessful ? 200 : 400);
  response.end();
};

const requestEnrollment = async (request: Request, response: Response) => {
  console.log('inside requestEnrollment');

  const businessId = getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(401);
    response.end();
    return;
  }

  const business = await AppDataSource.manager.findOne(Business, {
    where: {
      businessId: businessId,
    },
  });

  if (!business) {
    response.status(404);
    response.end();
    return;
  }

  const { firstName, lastName, phone, email } = request.body;

  if (!firstName || !lastName || !phone) {
    console.log('missing fields');
    response.status(401);
    response.end();
    return;
  }

  // let digitRegExp = /^\d+$/;

  console.log(
    'received input of ' +
      firstName +
      ' ' +
      lastName +
      ' ' +
      phone +
      ', ' +
      email,
  );

  var token: string | undefined = '';
  token = decryptToken(business.merchantAccessToken);

  const newEnrollmentId = await createEnrollmentRequest(
    businessId,
    firstName,
    lastName,
    phone,
    email,
  );

  response.status(newEnrollmentId ? 200 : 400);
  response.end();
};

const enrollCustomer = async (request: Request, response: Response) => {
  console.log('inside enrollCustomer');

  const businessId = getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(401);
    response.end();
    return;
  }

  const business = await AppDataSource.manager.findOne(Business, {
    where: {
      businessId: businessId,
    },
  });

  if (!business) {
    response.status(404);
    response.end();
    return;
  }

  const { firstName, lastName, phone, email } = request.body;

  if (!firstName || !lastName || !phone) {
    console.log('missing fields');
    response.status(401);
    response.end();
    return;
  }

  // let digitRegExp = /^\d+$/;

  console.log(
    'received input of ' +
      firstName +
      ' ' +
      lastName +
      ' +' +
      phone +
      ', ' +
      email,
  );

  var token: string | undefined = '';
  token = decryptToken(business.merchantAccessToken);

  if (token) {
    await enrollCustomerInLoyalty(
      businessId,
      token,
      firstName,
      lastName,
      phone,
      email,
    );
    response.status(201);
    response.end();
  }
};

const getLoyalty = async (request: Request, response: Response) => {
  console.log('inside getLoyalty');

  const businessId = getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(401);
    response.end();
    return;
  }

  // First, we'll get the Business so we can grab the access token and merchantId
  const business = await AppDataSource.manager.findOne(Business, {
    where: {
      businessId: businessId,
    },
  });

  if (!business) {
    response.status(404);
    response.end();
    return;
  }

  const loyalty = await AppDataSource.manager.findOne(Loyalty, {
    where: {
      businessId: businessId,
    },
  });

  var token: string | undefined = '';
  token = decryptToken(business.merchantAccessToken);
  if (token) {
    getMainLoyaltyProgramFromMerchant(
      token,
      function (
        loyaltyProgram: LoyaltyProgram,
        promotions: LoyaltyPromotion[],
        accrualType: string,
        catalogItemNameMap: Map<string, string>,
      ) {
        console.log(
          'got back program: ' +
            loyaltyProgram?.id +
            ', promo count: ' +
            promotions?.length +
            ', accrualType: ' +
            accrualType +
            ', categoryIdMap count: ' +
            catalogItemNameMap?.size,
        );

        if (loyaltyProgram) {
          if (loyalty) {
            if (
              isLoyaltyOrPromotionsOutOfDate(
                loyalty,
                loyaltyProgram,
                promotions,
              )
            ) {
              console.log('loyalty is out of date');
              updateAppLoyaltyFromMerchant(
                loyalty,
                loyaltyProgram,
                promotions,
                catalogItemNameMap,
                function (updatedloyalty: Loyalty) {
                  console.log('done updating loyalty');
                  if (updatedloyalty) {
                    //Get a refreshed loyalty
                    console.log(
                      'loyalty updated, now getting refreshed version',
                    );
                    getCurrentLoyaltyById(
                      updatedloyalty.id,
                      function (refreshedLoyalty: Loyalty) {
                        if (refreshedLoyalty) {
                          response.send(refreshedLoyalty);
                        } else {
                          response.status(500);
                          response.end();
                          return;
                        }
                      },
                    );
                  }
                },
              );
            } else {
              console.log('loyalty is not out of date');
              response.send(loyalty);
            }
          } else {
            createAppLoyaltyFromLoyaltyProgram(
              business.businessId,
              loyaltyProgram,
              promotions,
              catalogItemNameMap,
              function (newLoyalty: Loyalty) {
                if (newLoyalty) {
                  getCurrentLoyaltyById(
                    newLoyalty.id,
                    function (loyalty: Loyalty) {
                      if (loyalty) {
                        response.send(loyalty);
                      } else {
                        response.status(500);
                        response.end();
                        return;
                      }
                    },
                  );
                } else {
                  response.status(500);
                  response.end();
                  return;
                }
              },
            );
          }
        } else {
          // If no merchant loyalty is found, we should probably check app loyalty and remove it
          response.status(404);
          response.end();
        }
      },
    );
  } else {
    //TODO: How do we handle an invalid encrypted token? Need to notifiy someone
  }

  // if (!loyalty) {
  //       response.status(404);
  //       response.end();
  //       return;
  //   }

  // return loaded post
  // response.send(loyalty);
};

const updateLoyalty = async (request: Request, response: Response) => {
  const { loyaltyId } = request.params;

  const businessId = getBusinessIdFromAuthToken(request);
  console.log('businessId: ' + businessId + ', + loyaltyId ' + loyaltyId);

  if (!businessId || !loyaltyId) {
    console.log('missing input');
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

  updateLoyaltyItems(
    businessId,
    loyaltyId,
    loyaltyAccruals,
    promotions,
    loyaltyRewardTiers,
    function (wasSuccessful: boolean) {
      response.status(wasSuccessful ? 204 : 404);
      response.end();
    },
  );
};

const updateLoyaltyStatus = async (request: Request, response: Response) => {
  const { loyaltyId } = request.params;

  // console.log("showLoyaltyInApp: " + showLoyaltyInApp);

  const businessId = getBusinessIdFromAuthToken(request);

  console.log('businessId: ' + businessId + ', + loyaltyId' + loyaltyId);

  const {
    showLoyaltyInApp,
    showPromotionsInApp,
    automaticallyUpdateChangesFromMerchant,
    loyaltyStatus,
  } = request.body;

  if (!businessId || !loyaltyStatus) {
    console.log('missing input');
    response.status(400);
    response.end();
    return;
  }
  if (
    typeof showLoyaltyInApp != 'boolean' ||
    typeof showPromotionsInApp != 'boolean' ||
    typeof automaticallyUpdateChangesFromMerchant != 'boolean'
  ) {
    console.log('input fields not boolean');
    response.status(400);
    response.end();
    return;
  }

  if (!isValidLoyaltyStatus(loyaltyStatus)) {
    response.status(400);
    response.end();
    return;
  }

  updateLoyaltyStatuses(
    businessId,
    loyaltyId,
    showLoyaltyInApp,
    showPromotionsInApp,
    automaticallyUpdateChangesFromMerchant,
    loyaltyStatus,
    function (wasSuccessful: boolean) {
      response.status(wasSuccessful ? 204 : 500);
      response.end();
    },
  );
};

function isValidLoyaltyStatus(value: string): value is LoyaltyStatusType {
  return Object.values<string>(LoyaltyStatusType).includes(value);
}

const getCurrentLoyaltyById = async (loyaltyId: string, callback: any) => {
  const loyalty = await AppDataSource.manager.findOne(Loyalty, {
    where: {
      id: loyaltyId,
    },
  });
  callback(loyalty);
};

module.exports = {
  deleteEnrollmentRequest,
  enrollCustomer,
  enrollRequest,
  getLoyalty,
  requestEnrollment,
  updateLoyalty,
  updateLoyaltyStatus,
};
