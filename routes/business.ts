import { Request, Response } from 'express';
import { AppDataSource } from '../appDataSource';
import { Business } from '../src/entity/Business';
import {
  createNewBusinessWithLoyalty,
  findBusinessByMerchantId,
  updateBusinessEntity,
  getBusinessIdFromAuthToken,
  updateBusinessDetails,
} from '../src/services/BusinessService';

import crypto from 'crypto';

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

  const businessId = getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(400);
    return;
  }

  // const business = await AppDataSource.manager.findOne(Business, {
  //   select: { businessId, },
  //   where: {
  //     businessId: businessId,
  //   },
  // });

  const business = await Business.createQueryBuilder('business')
    .select([
      'business.businessId',
      'business.lastUpdateDate',
      'business.businessName',
      'business.addressLine1',
      'business.addressLine2',
      'business.city',
      'business.state',
      'business.zipCode',
      'business.phone',
      'business.hoursOfOperation',
      'business.businessDescription',
      'business.websiteUrl',
      'business.appStoreUrl',
      'business.googlePlayStoreUrl',
      'business.reviewsUrl',
    ])
    .where('business.businessId = :businessId', { businessId: businessId })
    .getOne();

  if (!business) {
    response.status(404);
    response.end();
    return;
  }
  response.send(business);
};

const createBusiness = async (request: Request, response: Response) => {
  console.log('inside createBusiness');

  const { merchantId, accessToken, refreshToken, expirationDate } =
    request.body;

  var businessId: string | undefined = undefined;
  var encryptedBusinessIdToken: string | undefined;

  businessId = getBusinessIdFromAuthToken(request);

  console.log('businessId: ' + businessId);
  console.log('accessToken: ' + accessToken);
  console.log('refreshToken: ' + refreshToken);

  var date: Date | undefined;
  console.log('expirationDate: ' + expirationDate);
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
      console.log('found business');
      // Business found, so update it with the latest tokens and exp date
      updateBusinessEntity(
        businessId,
        merchantId,
        accessToken,
        refreshToken,
        expirationDate,
        business,
        function (updatedBusiness: Business) {
          if (updatedBusiness?.businessId) {
            var businessResponse = Object();
            businessResponse.id = updatedBusiness.businessId;
            response.send(businessResponse);
            return;
          } else {
            response.sendStatus(500);
            return;
          }
        },
      );
    } else {
      // This should never happen where an auth token is passed with business id, but no corresponding business is found
      // If it does, the client should remove their businessId and resubmit
      response.sendStatus(404);
      return;
    }
  } else if (merchantId) {
    // lookup business by merchantId. If it's already been created, update it with the latest tokens and exp date
    findBusinessByMerchantId(
      merchantId,
      function (business: Business | undefined) {
        if (business) {
          console.log('Found business for merchantId');
          updateBusinessEntity(
            business.businessId,
            merchantId,
            accessToken,
            refreshToken,
            expirationDate,
            business,
            function (updatedBusiness: Business) {
              if (updatedBusiness?.businessId) {
                var businessResponse = Object();
                businessResponse.id = updatedBusiness.businessId;
                response.send(businessResponse);
                return;
              } else {
                response.sendStatus(500);
                return;
              }
            },
          );
        } else {
          createNewBusinessWithLoyalty(
            undefined,
            merchantId,
            accessToken,
            refreshToken,
            expirationDate,
            function (newBusiness: Business) {
              if (newBusiness?.businessId) {
                var businessResponse = Object();
                businessResponse.id = newBusiness.businessId;
                response.send(businessResponse);
                // return;
              } else {
                response.sendStatus(500);
                // return;
              }
            },
          );
        }
      },
    );
  } else {
    // No businessId or merchantId passed, so we can't look anything up to create or update a business
    response.sendStatus(404);
  }
};

const updateBusiness = async (request: Request, response: Response) => {
  console.log('inside updateBusiness');

  const businessId = getBusinessIdFromAuthToken(request);

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
  } = request.body;

  if (!businessName || !lastUpdateDate) {
    response.sendStatus(400);
    return;
  }

  console.log('businessId: ' + businessId);

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
  );
  response.status(wasUpdated ? 203 : 500);
  response.end();
};

module.exports = {
  getBusiness,
  createBusiness,
  updateBusiness,
};
