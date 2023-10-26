"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const Business_1 = require("../src/entity/Business");
const getBusinesses = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = request.params;
    if (!id) {
        response.status(400);
        return;
    }
    const businessRepository = (0, typeorm_1.getManager)().getRepository(Business_1.Business);
    const input = new Business_1.Business();
    const business = yield businessRepository.findOne({
        where: {
            businessId: id
        }
    });
    if (!business) {
        response.status(404);
        response.end();
        return;
    }
    // return loaded post
    response.send(business);
    // const entityManager = request.container.get(EntityManager);
    // const business = new Business();
    // business.name = 'john';
    // business.accessToken = "access token";
    // business.refreshToken = "refresh token";
    // business.accessTokenExpirationDate = new Date();
    // await entityManager.save(business);
    // response.send('Business saved');
});
/*
const createMerchant = (request: Request, response: Response) => {
  const {
      name,
      merchantId,
      accessToken,
      refreshToken,
      expirationDate,
  } = request.body
  var date = null;
  console.log("expirationDate: " + expirationDate);
  if (expirationDate) {
    date = new Date(expirationDate);
  }
  lookupBusinessByMerchantId(merchantId: string, function(business: Business) {
    if (business) {
      console.log("found business and updating it");

      pool.query(
       'UPDATE business SET "name" = $1, "accessToken" = $2, "refreshToken" = $3, "accessTokenExpirationDate" = $4 WHERE "businessId" = $5',
       [name, accessToken, refreshToken, date, business.businessId],
       (error: any, results: ay) => {
           if (error) {
               throw error
           }
           var id = Object();
           id.id = business.businessId;
           response.status(200).json(id);
       }
   )
    } else {
      console.log("inserting new business");
      pool.query('INSERT INTO business ("name", "merchantId", "accessToken", "refreshToken", "accessTokenExpirationDate") VALUES ($1, $2, $3, $4, $5) returning "businessId"', [name, merchantId, accessToken, refreshToken, date], (error: any, results: any) => {
          if (error) {
              throw error
          }
          var id = Object();
          id.id = results.rows[0].businessId;
          response.status(201).json(id);
      })
    }
  })
}

const lookupBusinessByMerchantId = (merchantId: string, completion: any) => {
  console.log("looking up business by merchantId: " + merchantId);
  pool.query('SELECT "businessId", "name", "merchantId", "accessToken", "refreshToken", "accessTokenExpirationDate" FROM business WHERE "merchantId" = $1', [merchantId], (error: any, results: any) => {
          if (error) {
            completion(null);
          } else {
            if (results && results.rows && results.rows[0]) {
              completion(results.rows[0]);
            } else {
              completion(null);
            }
          }
      })
}
*/
module.exports = {
    getBusinesses,
    // createMerchant,
};
