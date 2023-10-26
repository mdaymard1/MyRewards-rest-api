import { EntityManager, Repository } from 'typeorm';
import {Request, Response} from "express";
import {getManager} from "typeorm";
import { Business } from '../src/entity/Business';
import { encryptToken, decryptToken } from "../src/services/EncryptionService";
import { 
  createNewBusinessWithLoyalty, 
  createBusinessFromMerchantInfo, 
  findBusinessByMerchantId, 
  updateBusinessEntity,
  getBusinessIdFromAuthToken,
 } from "../src/services/BusinessService";

import crypto from "crypto";

const getBusiness = async (request: Request, response: Response) => {

  // const key = "f7fbba6e0636f890e56fbbf3283e524c";
  // const encryptionIV = "d82c4eb5261cb9c8";
  // const algorithm = "aes-256-cbc";
  // const cipher = crypto.createCipheriv(
  //   algorithm, Buffer.from(key), encryptionIV);
  // let encrypted = cipher.update("98da4a73-d817-45d4-ac17-8727bab88cbf", "utf8", "base64");
  // encrypted += cipher.final("base64");
  // console.log("encrypted: " + encrypted.toString("hex"))
  // return encrypted.toString("hex");

  const encoded: string = Buffer.from("EAAAEYQN7Eyq8Zx5TKdvij2iMg1wx7IqZWbwjPwzMIrFjcTeKSLTMWU0KmC2aTN_", 'utf8').toString('base64');
  const encryptedKey = encryptToken("EAAAEYQN7Eyq8Zx5TKdvij2iMg1wx7IqZWbwjPwzMIrFjcTeKSLTMWU0KmC2aTN_");

  const { id } = request.params;

  if (!id) {
    response.status(400);
    return;
  }

  const businessRepository = getManager().getRepository(Business);

  const business = await businessRepository.findOne({
    where: {
      businessId: id
    }
  });
  if (!business) {
        response.status(404);
        response.end();
        return;
    }
    response.send(business);
}

const createBusiness = async (request: Request, response: Response) => {
  const {
      merchantId,
      accessToken,
      refreshToken,
      expirationDate,
  } = request.body

  var businessId: string | undefined = undefined;
  var encryptedBusinessIdToken: string | undefined;

  businessId = getBusinessIdFromAuthToken(request);
  
  console.log("businessId: " + businessId);

  var date: Date | undefined;
  console.log("expirationDate: " + expirationDate);
  if (expirationDate) {
    date = new Date(expirationDate);
  }

  const businessRepository = getManager().getRepository(Business);

  if (businessId) {
    const business = await businessRepository.findOne({
      where: {
        businessId: businessId
      }
    });
    if (business) {
      console.log("found business");
      // Business found, so update it with the latest tokens and exp date
      updateBusinessEntity(businessRepository, businessId, merchantId, accessToken, refreshToken, expirationDate, business, function(updatedBusiness: Business) {
        if (updatedBusiness?.businessId) {
          var businessResponse = Object();
          businessResponse.id = updatedBusiness.businessId;
          response.send(businessResponse);
        } else {
          response.status(500);
          response.end();
          return;
        }
      });
    } else {
      // This should never happen where an auth token is passed with business id, but no corresponding business is found
      // If it does, the client should remove their businessId and resubmit
      response.status(404);
      response.end();
      return;
    }
  } else if (merchantId) {
    // lookup business by merchantId. If it's already been created, update it with the latest tokens and exp date
    findBusinessByMerchantId(merchantId, function(business: Business | undefined) {
      if (business) {
        console.log("Found business for merchantId");
        updateBusinessEntity(businessRepository, business.businessId, merchantId, accessToken, refreshToken, expirationDate, business, function(updatedBusiness: Business) {
          if (updatedBusiness?.businessId) {
            var businessResponse = Object();
            businessResponse.id = updatedBusiness.businessId;
            response.send(businessResponse);
          } else {
            response.status(500);
            response.end();
            return;
          }
        });
      } else {
        createNewBusinessWithLoyalty(businessRepository, undefined, merchantId, accessToken, refreshToken, expirationDate, function(newBusiness: Business) {
          if (newBusiness?.businessId) {
            var businessResponse = Object();
            businessResponse.id = newBusiness.businessId;
            response.send(businessResponse);
          } else {
            response.status(500);
            response.end();
            return;
          }
        });
      }
    });
  } else {
    // No businessId or merchantId passed, so we can't look anything up to create or update a business
    response.status(404);
    response.end();
    return;
  }
}

module.exports = {
  getBusiness,
  createBusiness,
}
