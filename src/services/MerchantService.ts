import {
  ApiError,
  Client,
  Error,
  Environment,
  BatchRetrieveCatalogObjectsRequest,
  LoyaltyPromotion,
  Merchant,
  RetrieveMerchantResponse,
  LoyaltyProgramAccrualRule,
} from 'square';
import { decryptToken } from './EncryptionService';

import dotenv from 'dotenv';
import { SquareAccrualRules } from './entity/SquareWebhook';
import { LoyaltyAccrual } from '../entity/LoyaltyAccrual';

export const getMerchantInfo = async (
  merchantId: string,
  accessToken: string,
  callback: any,
) => {
  console.log('inside getMerchantInfo');

  var token: string | undefined = '';
  token = decryptToken(accessToken);

  console.log('converted encrypted token: ' + accessToken + ' to ' + token);
  console.log('merchantId: ' + merchantId);

  const client = new Client({
    accessToken: token,
    environment: Environment.Sandbox,
  });
  const { merchantsApi } = client;

  try {
    const merchantResponse = await merchantsApi.retrieveMerchant(merchantId);
    if (merchantResponse?.result?.merchant) {
      console.log(
        'returning merchant for id: ' + merchantResponse?.result?.merchant?.id,
      );
      callback(merchantResponse?.result?.merchant);
    } else {
      callback(undefined);
    }
  } catch (err) {
    console.log('merchantsApi.retrieveMerchant returned an error: ' + err);
    callback(undefined);
  }
};

export const getMainLoyaltyProgramFromMerchant = async (
  token: string,
  callback: any,
) => {
  console.log('token: ' + token);

  const client = new Client({
    accessToken: token,
    environment: Environment.Sandbox,
  });

  const { catalogApi, loyaltyApi } = client;

  try {
    let loyaltyProgramResponse = await loyaltyApi.retrieveLoyaltyProgram(
      'main',
    );
    console.log('response: ' + loyaltyProgramResponse?.result);

    const program = loyaltyProgramResponse?.result?.program;

    if (!program) {
      callback(undefined);
      return;
    }
    console.log('program id: ' + program.id);

    var promotions: LoyaltyPromotion[] = [];

    let promotionsResponse = await loyaltyApi.listLoyaltyPromotions(
      program.id!,
      'ACTIVE',
    );
    console.log('response: ' + promotionsResponse?.result);

    if (!promotionsResponse) {
      callback(undefined);
    }
    if (promotionsResponse.result?.loyaltyPromotions) {
      promotions = promotionsResponse.result.loyaltyPromotions;
    }
    let scheduledPromotionsResponse = await loyaltyApi.listLoyaltyPromotions(
      program.id!,
      'SCHEDULED',
    );
    console.log(
      'scheduledPromotionsResponse: ' + scheduledPromotionsResponse?.result,
    );
    if (scheduledPromotionsResponse.result?.loyaltyPromotions) {
      scheduledPromotionsResponse.result!.loyaltyPromotions.forEach(function (
        promo,
      ) {
        promotions.push(promo);
      });
    }

    var categoryIds: String[] = [];
    // var categoryNameMap = new Map<string, string>();
    var accrualType = '';
    // Loop through each tier to determine its type

    if (program.accrualRules) {
      getCategoryIdMapFromAccurals(
        token,
        program.accrualRules,
        function (categoryNameMap: Map<string, string>) {
          callback(program, promotions, accrualType, categoryNameMap);
        },
      );
      //   program.accrualRules.forEach(function (accrualRule) {
      //     console.log(accrualRule.accrualType);
      //     if (accrualRule.accrualType == "CATEGORY" && accrualRule.categoryData?.categoryId) {
      //       accrualType = "CATEGORY";
      //       categoryIds.push(accrualRule.categoryData!.categoryId);
      //     } else if (accrualRule.accrualType == "VISIT") {
      //       accrualType = "VISIT";
      //     } else if (accrualRule.accrualType == "SPEND") {
      //       accrualType = "SPEND";
      //     } else if (accrualRule.accrualType == "ITEM") {
      //       accrualType = "ITEM";
      //     }
      //   });

      //   if (categoryIds.length > 0) {
      //     var catIds: string[] = [];
      //     categoryIds.forEach(function(categoryId) {
      //       catIds.push(categoryId.toString());
      //     })
      //     const body: BatchRetrieveCatalogObjectsRequest = {
      //       objectIds: catIds,
      //       includeRelatedObjects: true,
      //       includeDeletedObjects: false,
      //     };
      //     var categoryResults = await catalogApi.batchRetrieveCatalogObjects(body);
      //     if (categoryResults?.result?.objects) {
      //       categoryResults?.result?.objects.forEach(function(catalogObject) {
      //         if (catalogObject.type == "CATEGORY" && catalogObject.categoryData?.name) {
      //           console.log("received a category back");

      //           categoryNameMap.set(catalogObject.id, catalogObject.categoryData.name) ;
      //         }
      //       })
      //     }
      //   }
    }

    callback(program, promotions, accrualType, new Map<string, string>());
  } catch (error) {
    if (error instanceof ApiError) {
      error.result.errors.forEach(function (e: Error) {
        console.log(e.category);
        console.log(e.code);
        console.log(e.detail);
      });
    } else {
      console.log(
        'Unexpected error occurred while getting loyalty program: ',
        error,
      );
    }
  }
};

export const getCategoryIdMapFromAccurals = async (
  token: string,
  accrualRules: LoyaltyProgramAccrualRule[] | SquareAccrualRules[],
  callback: any,
) => {
  console.log('inside getCategoryIdMapFromAccurals');

  var categoryIds: String[] = [];
  var categoryNameMap = new Map<string, string>();

  // Loop through each accrual rule to determine its type
  for (var accrualRule of accrualRules) {
    console.log(accrualRule.accrualType);
    if (
      accrualRule.accrualType == 'CATEGORY' &&
      accrualRule.categoryData?.categoryId
    ) {
      categoryIds.push(accrualRule.categoryData!.categoryId);
    }
  }

  if (categoryIds.length > 0) {
    const client = new Client({
      accessToken: token,
      environment: Environment.Sandbox,
    });

    const { catalogApi } = client;

    var catIds: string[] = [];
    categoryIds.forEach(function (categoryId) {
      catIds.push(categoryId.toString());
    });
    const body: BatchRetrieveCatalogObjectsRequest = {
      objectIds: catIds,
      includeRelatedObjects: true,
      includeDeletedObjects: false,
    };
    var categoryResults = await catalogApi.batchRetrieveCatalogObjects(body);
    if (categoryResults?.result?.objects) {
      categoryResults?.result?.objects.forEach(function (catalogObject) {
        if (
          catalogObject.type == 'CATEGORY' &&
          catalogObject.categoryData?.name
        ) {
          console.log(
            'received a category back: ' + catalogObject.categoryData.name,
          );

          categoryNameMap.set(
            catalogObject.id,
            catalogObject.categoryData.name,
          );
        }
      });
    }
    callback(categoryNameMap);
  } else {
    callback(categoryNameMap);
  }
};

module.exports = {
  getCategoryIdMapFromAccurals,
  getMerchantInfo,
  getMainLoyaltyProgramFromMerchant,
};
