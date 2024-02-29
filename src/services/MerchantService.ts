import {
  ApiError,
  Client,
  Error,
  Environment,
  BatchRetrieveCatalogObjectsRequest,
  LoyaltyPromotion,
  CreateCustomerRequest,
  CreateLoyaltyAccountRequest,
  LoyaltyProgramAccrualRule,
  SearchCustomersRequest,
  UpdateCustomerRequest,
} from 'square';
// import { UUID } from 'crypto';
import { decryptToken } from './EncryptionService';

import dotenv from 'dotenv';
import { SquareAccrualRules } from './entity/SquareWebhook';
import { LoyaltyAccrual } from '../entity/LoyaltyAccrual';

export const createLoyaltyAccount = async (
  accessToken: string,
  loyaltyProgramId: string,
  phoneNumber: string,
) => {
  console.log(
    'inside createLoyaltyAccount with loyaltyProgramId: ' +
      loyaltyProgramId +
      ', phoneNumber: ' +
      phoneNumber,
  );

  const env =
    process.env.NODE_ENV == 'development'
      ? Environment.Sandbox
      : Environment.Production;

  const client = new Client({
    squareVersion: '2024-01-18',
    accessToken: accessToken,
    environment: env,
  });

  const crypto = require('crypto');

  let idempotencyKey = crypto.randomUUID();
  console.log('idempotencyKey: ' + idempotencyKey);
  const createLoyaltyBody: CreateLoyaltyAccountRequest = {
    loyaltyAccount: {
      programId: loyaltyProgramId,
      mapping: {
        phoneNumber: phoneNumber,
      },
    },
    idempotencyKey: idempotencyKey,
  };
  const { loyaltyApi } = client;

  try {
    let createLoyaltyAccountResponse = await loyaltyApi.createLoyaltyAccount(
      createLoyaltyBody,
    );
    if (createLoyaltyAccountResponse) {
      console.log(
        'just created loyalty account in square. Loyalty account id: ' +
          createLoyaltyAccountResponse.result.loyaltyAccount?.id +
          ', customerId: ' +
          createLoyaltyAccountResponse.result.loyaltyAccount?.customerId,
      );
    }
    return createLoyaltyAccountResponse.result.loyaltyAccount?.customerId;
  } catch (error) {
    if (error instanceof ApiError) {
      // @ts-expect-error: unused variables
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const errors = error.result;
      const { statusCode, headers } = error;
      console.log('Got an error while creating loyalty account: ' + statusCode);
      if (error.errors && error.errors.length > 0) {
        console.log('error: ' + error.errors[0].detail);
      }
    }
    return null;
  }
};

export const lookupCustomerIdByPhoneNumber = async (
  accessToken: string,
  phoneNumber: string,
) => {
  console.log('inside lookupCustomerByPhoneNumber');

  const env =
    process.env.NODE_ENV == 'development'
      ? Environment.Sandbox
      : Environment.Production;

  const client = new Client({
    squareVersion: '2024-01-18',
    accessToken: accessToken,
    environment: env,
  });

  const body: SearchCustomersRequest = {
    query: {
      filter: {
        phoneNumber: {
          exact: phoneNumber,
        },
      },
    },
  };
  const { customersApi } = client;

  try {
    let searchCustomerResponse = await customersApi.searchCustomers(body);
    if (
      searchCustomerResponse.result.customers &&
      searchCustomerResponse.result.customers.length > 0
    ) {
      console.log(
        'found customer with id of ' +
          searchCustomerResponse.result.customers[0].id,
      );
      return searchCustomerResponse.result.customers[0].id;
    }
    console.log('customer not found');
    return null;
  } catch (error) {
    if (error instanceof ApiError) {
      // @ts-expect-error: unused variables
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const errors = error.result;
      const { statusCode, headers } = error;
      console.log('Got an error while creating square customer: ' + statusCode);
      if (error.errors && error.errors.length > 0) {
        console.log('error: ' + error.errors[0].detail);
      }
    }
    return null;
  }
};

export const upsertMerchantCustomerAccount = async (
  accessToken: string,
  merchantCustomerId: string,
  appCustomerId: string,
  firstName: string,
  lastName: string,
  phone: string,
  email?: string,
) => {
  console.log('inside upsertMerchantCustomerAccount');

  const env =
    process.env.NODE_ENV == 'development'
      ? Environment.Sandbox
      : Environment.Production;

  const client = new Client({
    squareVersion: '2024-01-18',
    accessToken: accessToken,
    environment: env,
  });
  const { customersApi } = client;

  try {
    let retrieveCustomerResponse = await customersApi.retrieveCustomer(
      merchantCustomerId,
    );
    let existingCustomer = retrieveCustomerResponse.result.customer;
    // Only update fields that are missing
    if (existingCustomer) {
      console.log('found customer account. updating...');
      const body: UpdateCustomerRequest = {
        givenName: existingCustomer.givenName ?? firstName,
        familyName: existingCustomer.familyName ?? lastName,
        emailAddress: existingCustomer.emailAddress ?? email,
        referenceId: appCustomerId,
      };
      let updateCustomerResponse = await customersApi.updateCustomer(
        merchantCustomerId,
        body,
      );
      return existingCustomer.id;
    } else {
      console.log('customer not returned in response');
    }
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.errors && error.errors.length > 0) {
        console.log('error: ' + error.errors[0].detail);
      }
    } else {
      console.log('some unexpected error: ' + error);
    }
  }
};

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

  const env =
    process.env.NODE_ENV == 'development'
      ? Environment.Sandbox
      : Environment.Production;

  const client = new Client({
    accessToken: token,
    environment: env,
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

  dotenv.config();

  const env =
    process.env.NODE_ENV == 'development'
      ? Environment.Sandbox
      : Environment.Production;
  console.log('looking up ProgramLoyalty in env: ' + env);
  const client = new Client({
    squareVersion: '2024-01-18',
    accessToken: token,
    environment: env,
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
      return;
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
      getCatalogItemIdMapFromAccurals(
        token,
        program.accrualRules,
        function (catalogItemNameMap: Map<string, string>) {
          callback(program, promotions, accrualType, catalogItemNameMap);
          return;
        },
      );
    } else {
      callback(program, promotions, accrualType, new Map<string, string>());
    }
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
    callback(undefined);
  }
};

export const getCatalogItemIdMapFromAccurals = async (
  token: string,
  accrualRules: LoyaltyProgramAccrualRule[] | SquareAccrualRules[],
  callback: any,
) => {
  console.log('inside getCatalogItemIdMapFromAccurals');

  var catalogItemIds: String[] = [];
  var itemNameMap = new Map<string, string>();
  var variantItemMap = new Map<string, string>();

  console.log('accrualRules size: ' + accrualRules.length);

  // Loop through each accrual rule to determine its type
  for (var accrualRule of accrualRules) {
    console.log(
      accrualRule.accrualType +
        ', categoryId: ' +
        accrualRule.categoryData?.categoryId,
    );
    if (
      accrualRule.accrualType == 'CATEGORY' &&
      accrualRule.categoryData?.categoryId
    ) {
      catalogItemIds.push(accrualRule.categoryData!.categoryId);
      console.log(
        'adding categoryId: ' +
          accrualRule.categoryData.categoryId +
          ' to lookup list',
      );
    } else if (
      accrualRule.accrualType == 'ITEM_VARIATION' &&
      accrualRule.itemVariationData?.itemVariationId
    ) {
      catalogItemIds.push(accrualRule.itemVariationData.itemVariationId);
      variantItemMap.set(
        accrualRule.itemVariationData.itemVariationId,
        accrualRule.itemVariationData.itemVariationId,
      );
      console.log(
        'adding itemId: ' +
          accrualRule.itemVariationData.itemVariationId +
          ' to lookup list',
      );
    }
  }

  if (catalogItemIds.length > 0) {
    console.log('Fetching items from catalog to get item names');
    const client = new Client({
      accessToken: token,
      environment: Environment.Sandbox,
    });

    const { catalogApi } = client;

    var itemIds: string[] = [];
    catalogItemIds.forEach(function (itemId) {
      itemIds.push(itemId.toString());
    });
    const body: BatchRetrieveCatalogObjectsRequest = {
      objectIds: itemIds,
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

          itemNameMap.set(catalogObject.id, catalogObject.categoryData.name);
        }
      });
    }
    console.log('searching related objects for variantIds');
    // Items are returned in relatedObjects, so we must loop thru its variants
    // to look for a match on variant id and then take it's parent (item) name
    if (categoryResults.result.relatedObjects) {
      for (var relatedObject of categoryResults.result.relatedObjects) {
        if (
          relatedObject.type == 'ITEM' &&
          relatedObject.itemData?.variations
        ) {
          for (var variant of relatedObject.itemData.variations) {
            const variantFromMap = variantItemMap.get(variant.id);
            if (variantFromMap) {
              if (relatedObject.itemData.name) {
                console.log(
                  'received an item back: ' + relatedObject.itemData.name,
                );
                itemNameMap.set(variant.id, relatedObject.itemData.name);
              }
            }
          }
        }
      }
    }
    callback(itemNameMap);
  } else {
    callback(itemNameMap);
  }
};

module.exports = {
  createLoyaltyAccount,
  getCatalogItemIdMapFromAccurals,
  getMerchantInfo,
  getMainLoyaltyProgramFromMerchant,
  lookupCustomerIdByPhoneNumber,
  upsertMerchantCustomerAccount,
};
