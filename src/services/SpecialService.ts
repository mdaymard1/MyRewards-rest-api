import { AppDataSource } from '../../appDataSource';
import { decryptToken, encryptToken } from './EncryptionService';
import { Loyalty } from '../entity/Loyalty';
import { Special } from '../entity/Special';
import { SpecialItem } from '../entity/SpecialItem';
import { Business } from '../entity/Business';
import {
  SquareCatalogVersionUpdated,
  SquareTerminology,
} from './entity/SquareWebhook';
import {
  CatalogImage,
  Client,
  Environment,
  LoyaltyProgram,
  SearchCatalogObjectsRequest,
} from 'square';
import { boolean, string } from 'square/dist/types/schema';
import { LoyaltyAccrual } from '../entity/LoyaltyAccrual';
import {
  updateAppLoyaltyAccrualsFromMerchant,
  updateBusinessLoyaltyCatalogIndicator,
  removeOldAccrualRules,
  getMoneyCurrencyType,
} from './LoyaltyService';
import {
  getMainLoyaltyProgramFromMerchant,
  getCatalogItemIdMapFromAccurals,
} from './MerchantService';
import { UUID } from 'crypto';
// import superAgent from 'superagent';

export const getAllSpecials = async (businessId: string, callback: any) => {
  console.log('inside getAllSpecials');

  const specials = await AppDataSource.manager.find(Special, {
    where: {
      businessId: businessId,
    },
  });
  callback(specials);
};

export const createSpecial = async (
  businessId: string,
  special: Special,
  callback: any,
) => {
  console.log('inside createSpecial');

  const startDate = special.startDate
    ? new Date(special.startDate)
    : new Date();
  const endDate = special.endDate ? new Date(special.endDate) : null;
  const newSpecial = await AppDataSource.manager.create(Special, {
    title: special.title,
    description: special.description,
    showItemDetails: special.showItemDetails ?? true,
    showItemPhotos: special.showItemPhotos ?? true,
    showItemPrices: special.showItemPrices ?? true,
    startDate: startDate,
    endDate: endDate,
    businessId: businessId,
  });
  await AppDataSource.manager.save(newSpecial);
  console.log('just created new special with id: ' + newSpecial.id);

  let sortOrder = 1;

  if (special.items) {
    createSpecialItems(
      newSpecial,
      special.items,
      function (wasSuccessful: boolean) {
        updateBusinessSpecialCatalogIndicator(businessId);
        callback(newSpecial.id);
      },
    );
  } else {
    callback(undefined);
  }
};

const updateBusinessSpecialCatalogIndicator = async (businessId: string) => {
  const totalCatalogReferences = await SpecialItem.createQueryBuilder(
    'specialItem',
  )
    .leftJoinAndSelect('specialItem.special', 'special')
    .where('special.businessId = :id', { id: businessId })
    .andWhere('specialItem.isManuallyEntered = false')
    .getCount();

  console.log(
    'updateBusinessSpecialCatalogIndicator got count of ' +
      totalCatalogReferences,
  );

  await AppDataSource.manager.update(
    Business,
    {
      businessId: businessId,
    },
    {
      specialsUseCatalogItems: totalCatalogReferences > 0,
      lastUpdateDate: new Date(),
    },
  );
};

export const updateExistingSpecial = async (
  specialId: string,
  special: Special,
  callback: any,
) => {
  console.log('inside updateExistingSpecial');

  const existingSpecial = await AppDataSource.manager.findOne(Special, {
    where: {
      id: specialId,
    },
  });

  if (!existingSpecial) {
    console.log('special not found');
    callback(false);
    return;
  }

  existingSpecial.title = special.title;
  existingSpecial.description = special.description;
  existingSpecial.showItemDetails = special.showItemDetails;
  existingSpecial.showItemPhotos = special.showItemPhotos;
  existingSpecial.showItemPrices = special.showItemPrices;

  const startDate = special.startDate
    ? new Date(special.startDate)
    : new Date();
  const endDate = special.endDate ? new Date(special.endDate) : null;

  existingSpecial.startDate = startDate;
  existingSpecial.endDate = endDate;

  await AppDataSource.manager.save(existingSpecial);

  var specialIndex = 0;

  // Replace each item base on matching index
  for (var i = 0; i < existingSpecial.items.length; i++) {
    if (i < special.items.length) {
      console.log('updating existing item from input special, index: ' + i);
      await AppDataSource.manager.update(
        SpecialItem,
        {
          id: existingSpecial.items[i].id,
        },
        {
          sortOrder: i + 1,
          name: special.items[i].name,
          itemId: special.items[i].itemId,
          itemDescription: special.items[i].itemDescription,
          isManuallyEntered: special.items[i].isManuallyEntered,
          itemPriceRange: special.items[i].itemPriceRange,
          priceCurrency: special.items[i].priceCurrency,
          imageUrl: special.items[i].imageUrl,
        },
      );
    }
  }

  if (special.items.length > existingSpecial.items.length) {
    // Create any additional items
    for (var i = existingSpecial.items.length; i < special.items.length; i++) {
      console.log('creating item from input special, index: ' + i);
      const newSpecialItem = await AppDataSource.manager.create(SpecialItem, {
        specialId: existingSpecial.id,
        sortOrder: i + 1,
        name: special.items[i].name,
        itemId: special.items[i].itemId,
        itemDescription: special.items[i].itemDescription,
        isManuallyEntered: special.items[i].isManuallyEntered,
        itemPriceRange: special.items[i].itemPriceRange,
        priceCurrency: special.items[i].priceCurrency,
        imageUrl: special.items[i].imageUrl,
      });
      await AppDataSource.manager.save(newSpecialItem);
    }
  } else if (special.items.length < existingSpecial.items.length) {
    // Remove remaining items
    for (var i = special.items.length; i < existingSpecial.items.length; i++) {
      console.log('deleting existing item, index: ' + i);
      await AppDataSource.manager.delete(
        SpecialItem,
        existingSpecial.items[i].id,
      );
    }
  }

  updateBusinessSpecialCatalogIndicator(existingSpecial.businessId);

  callback(true);
};

export const deleteExistingSpecial = async (
  specialId: string,
  callback: any,
) => {
  console.log('inside deleteExistingSpecial');

  await AppDataSource.manager.delete(Special, {
    id: specialId,
  });
  callback(true);
};

const createSpecialItems = async (
  special: Special,
  specialItems: SpecialItem[],
  callback: any,
) => {
  let sortOrder = 1;

  for (var item of specialItems) {
    const newSpecialItem = await AppDataSource.manager.create(SpecialItem, {
      specialId: special.id,
      sortOrder: sortOrder,
      name: item.name,
      itemId: item.itemId,
      itemDescription: item.itemDescription,
      isManuallyEntered: item.isManuallyEntered,
      itemPriceRange: item.itemPriceRange,
      priceCurrency: item.priceCurrency,
      imageUrl: item.imageUrl,
    });
    await AppDataSource.manager.save(newSpecialItem);
    sortOrder += 1;
  }
  callback(true);
};

export const updateSpecialsFromWebhook = async (
  merchantId: string,
  catalogVersionUpdated: SquareCatalogVersionUpdated,
  callback: any,
) => {
  console.log('inside updateSpecialsFromWebhook');

  const business = await Business.createQueryBuilder('business')
    .where('business.merchantId = :merchantId', { merchantId: merchantId })
    .getOne();

  if (!business) {
    console.log("Can't find Business for merchantId: " + merchantId);
    callback(false);
    return;
  }

  // See if we need to update catalog items
  if (!business.loyaltyUsesCatalogItems && !business.specialsUseCatalogItems) {
    console.log('catalog update is not required for specials or loyalty');
    callback(false);
    return;
  }

  const token = decryptToken(business.merchantAccessToken);

  if (!token) {
    console.log("Can't get token");
    callback(false);
    return;
  }

  const accessTokenExpirationDate = business.accessTokenExpirationDate;
  if (!accessTokenExpirationDate || !business.merchantRefreshToken) {
    console.log("Can't get token");
    callback(false);
    return;
  }

  const diffInTime = accessTokenExpirationDate.getTime() - new Date().getTime();
  const diffInDays = diffInTime / (1000 * 3600 * 24);
  console.log('number of days till token expires');

  if (diffInDays < 8) {
    const accessToken = decryptToken(business.merchantAccessToken);
    const refreshToken = decryptToken(business.merchantRefreshToken);
    console.log(
      'accessToken: ' + accessToken + ', refreshToken: ' + refreshToken,
    );
    if (!refreshToken) {
      console.log('could not decrypt refresh token');
      callback(true);
      return;
    }
    const newTokens = await requestNewTokens(refreshToken);
    if (newTokens) {
      const newAccessToken = newTokens[0] as string;
      const newRefreshToken = newTokens[1] as string;
      const newRefreshDate = newTokens[2] as Date;
      await AppDataSource.manager.update(
        Business,
        {
          businessId: business.businessId,
        },
        {
          merchantAccessToken: newAccessToken,
          merchantRefreshToken: newRefreshToken,
          accessTokenExpirationDate: newRefreshDate,
        },
      );
      console.log('Just updated tokens in business');
    } else {
      callback(true);
    }
  }

  getCatalogItemsLastUpdated(
    business.lastUpdateDate,
    token,
    function (
      catalogIdMapAndVariantStates: [
        catalogMap: Map<string, any>,
        deletedVariants: boolean,
      ],
    ) {
      if (business.loyaltyUsesCatalogItems) {
        updateLoyaltyAccrualsFromCatalogChangesIfNeeded(
          business.businessId,
          catalogIdMapAndVariantStates,
          token,
          function (wasSuccessful: boolean) {
            if (business.specialsUseCatalogItems) {
              updateSpecialsFromCatalogChangesIfNeeded(
                business.businessId,
                catalogIdMapAndVariantStates[0],
                function (wasSuccessful: boolean) {
                  callback(true);
                },
              );
            }
          },
        );
      } else if (business.specialsUseCatalogItems) {
        updateSpecialsFromCatalogChangesIfNeeded(
          business.businessId,
          catalogIdMapAndVariantStates[0],
          function (wasSuccessful: boolean) {
            console.log(
              'returned from updateSpecialsFromCatalogChangesIfNeeded',
            );
            callback(true);
          },
        );
      }
    },
  );
};

const requestNewTokens = async (refreshToken: string) => {
  console.log('inside requestNewTokens');

  console.log('refreshToken: ' + refreshToken);
  try {
    const requestBody = {
      refresh_token: refreshToken,
      redirect_uri: 'https://myredirectendpoint.com/callback',
      grant_type: 'refresh_token',
      code_verifier: 'PCOQi8CHfaRU3Q8NlKLNvu2AiKOd0wKneQdb8vUiF4U',
      client_id: 'sq0idp-UKXXq5VxNXSDxNAV1manlQ',
    };
    const superAgent = require('superagent');

    const result = await superAgent
      .post('https://connect.squareup.com/oauth2/token')
      .set('Content-Type', 'application/json')
      .send(requestBody);

    console.log(
      'got response from server. result: ' + result + ', body: ' + result?.body,
    );
    console.log('result.access_token: ' + result?.body?.access_token);
    console.log('result.errors: ' + result?.body?.errors);

    const errors = result?.body?.errors;
    if (errors) {
      console.log('errors returned when requesting new token: ' + errors);
      return undefined;
    }
    const newAccessToken = result?.body.access_token;
    const newRefreshToken = result?.body.refresh_token;
    const newRefreshDate = result?.body.expires_at;

    if (!newAccessToken || !newRefreshToken || !newRefreshDate) {
      console.log('tokens not returned when requesting new token');
      return undefined;
    }
    const encryptedAccessToken = encryptToken(newAccessToken);
    const encryptedRefreshToken = encryptToken(newRefreshToken);
    const refreshDate = new Date(newRefreshDate);
    console.log(
      'returning new access token: ' +
        newAccessToken +
        ', new refresh token: ' +
        newRefreshToken +
        ', new expiration date:' +
        refreshDate,
    );
    return [encryptedAccessToken, encryptedRefreshToken, refreshDate];
  } catch (err) {
    console.log('Error while requesting new token: ' + err);
    return undefined;
  }
};

const updateSpecialsFromCatalogChangesIfNeeded = async (
  businessId: string,
  catalogMap: Map<string, any>,
  callback: any,
) => {
  console.log('inside updateSpecialsFromCatalogChangesIfNeeded');

  let itemIds: string[] = [];

  // Create array of item ids to search for
  catalogMap.forEach(function (key, value) {
    itemIds.push(value);
    console.log('adding key to search list: ' + key + ', value: ' + value);
  });

  if (itemIds.length > 0) {
    // get all special items matching the catalog items that just changed
    const itemSpecials = await SpecialItem.createQueryBuilder('specialItem')
      .where('specialItem.itemId IN (:...ids)', { ids: itemIds })
      .getMany();

    if (itemSpecials && itemSpecials.length > 0) {
      console.log('some items have change: ' + itemSpecials.length);
      for (var itemSpecial of itemSpecials) {
        const changedItem = catalogMap.get(itemSpecial.itemId);
        if (changedItem) {
          if (changedItem.isDeleted) {
            await AppDataSource.manager.delete(SpecialItem, {
              id: itemSpecial.id,
            });
          } else {
            console.log(
              'updating existing item from input special, index: ' +
                changedItem.itemData.name,
            );
            // Determine price from variants
            let priceRange: string | undefined;
            let priceCurrency: string | undefined;
            let minCurrencyAmount: number | undefined;
            let minCurrencyCurrency: string | undefined;
            let maxCurrencyAmount: number | undefined;
            let maxCurrencyCurrency: string | undefined;
            if (changedItem.itemData.variations) {
              for (var variation of changedItem.itemData.variations) {
                if (
                  variation.type == 'ITEM_VARIATION' &&
                  variation.itemVariationData?.priceMoney?.amount
                ) {
                  const amount =
                    variation.itemVariationData?.priceMoney?.amount;
                  console.log('item amount: ' + amount);
                  const currency =
                    variation.itemVariationData?.priceMoney?.currency ?? 'USD';
                  if (amount && currency) {
                    const adjustedAmount = Number(amount) / 100.0;
                    if (!minCurrencyAmount) {
                      minCurrencyAmount = adjustedAmount;
                      minCurrencyCurrency = currency;
                    }
                    if (!maxCurrencyAmount) {
                      maxCurrencyAmount = adjustedAmount;
                      maxCurrencyCurrency = currency;
                    }
                    if (minCurrencyAmount) {
                      if (adjustedAmount < minCurrencyAmount) {
                        minCurrencyAmount = adjustedAmount;
                        minCurrencyCurrency = currency;
                      }
                    }
                    if (maxCurrencyAmount) {
                      if (adjustedAmount > maxCurrencyAmount) {
                        maxCurrencyAmount = adjustedAmount;
                        maxCurrencyCurrency = currency;
                      }
                    }
                  }
                }
              }
            }
            if (minCurrencyAmount && maxCurrencyAmount) {
              if (minCurrencyAmount == maxCurrencyAmount) {
                const currencyType = getMoneyCurrencyType(minCurrencyCurrency);
                if (currencyType) {
                  const formattedPrice = minCurrencyAmount.toLocaleString(
                    currencyType,
                    {
                      style: 'currency',
                      currency: minCurrencyCurrency,
                      maximumFractionDigits: 2,
                    },
                  );
                  priceRange = formattedPrice;
                  priceCurrency = minCurrencyCurrency;
                }
              } else {
                const minCurrencyType =
                  getMoneyCurrencyType(minCurrencyCurrency);
                const maxCurrencyType =
                  getMoneyCurrencyType(maxCurrencyCurrency);
                if (minCurrencyType && maxCurrencyType) {
                  const formattedMinPrice = minCurrencyAmount.toLocaleString(
                    minCurrencyType,
                    {
                      style: 'currency',
                      currency: minCurrencyCurrency,
                      maximumFractionDigits: 2,
                    },
                  );
                  const formattedMaxPrice = maxCurrencyAmount.toLocaleString(
                    maxCurrencyType,
                    {
                      style: 'currency',
                      currency: maxCurrencyCurrency,
                      maximumFractionDigits: 2,
                    },
                  );
                  priceRange = formattedMinPrice + ' - ' + formattedMaxPrice;
                  priceCurrency = maxCurrencyCurrency;
                }
              }
            }
            console.log('priceRange: ' + priceRange);
            console.log('priceCurrency: ' + priceCurrency);

            // Check if image url has changed
            let firstImageUrl: string | undefined = undefined;
            let imageWasDeleted = false;

            if (changedItem.itemData.imageIds) {
              for (var imageId of changedItem.itemData.imageIds) {
                const imageObject = catalogMap.get(imageId);
                if (
                  imageObject &&
                  !imageObject.isDeleted &&
                  imageObject.imageData
                ) {
                  firstImageUrl = imageObject.imageData.url;
                  console.log(
                    'found image for specialItemId: ' +
                      changedItem.id +
                      ', url: ' +
                      firstImageUrl,
                  );
                }
              }
            }
            console.log('firstImageUrl: ' + firstImageUrl);
            await AppDataSource.manager.update(
              SpecialItem,
              {
                id: itemSpecial.id,
              },
              {
                name: changedItem.itemData.name,
                itemDescription: changedItem.itemData.description,
                itemPriceRange: priceRange,
                priceCurrency: priceCurrency,
                imageUrl: firstImageUrl ?? null,
              },
            );
          }
        }
      }
    }
  }
  updateBusinessSpecialCatalogIndicator(businessId);
  callback(true);
};

const updateLoyaltyAccrualsFromCatalogChangesIfNeeded = async (
  businessId: string,
  catalogIdMapAndVariantStates: [
    catalogMap: Map<string, any>,
    deletedVariants: boolean,
  ],
  token: string,
  callback: any,
) => {
  let wereLoyaltyItemsUpdated = false;

  // If a variant was deleted, we don't get the variantId and so can't check to see if
  // it was in an accrual. So unfortunately, we need to assume it may have been on an
  // accrual and the request a loyalty update from the merchant
  if (catalogIdMapAndVariantStates[1]) {
    wereLoyaltyItemsUpdated = true;
  } else {
    // get all loyalty accrual and their categories or variant ids
    const accruals = await LoyaltyAccrual.createQueryBuilder('loyaltyAccrual')
      .where(
        "loyaltyAccrual.accrualType = 'CATEGORY' OR loyaltyAccrual.accrualType = 'ITEM_VARIATION'",
      )
      .getMany();

    if (accruals) {
      accruals.forEach((accrual) => {
        const catalogId =
          accrual.accrualType == 'CATEGORY'
            ? accrual.categoryId
            : accrual.variantId;
        console.log('checking catalogMap for catalogId: ' + catalogId);
        const catalogItem = catalogIdMapAndVariantStates[0].get(catalogId);
        if (catalogItem) {
          wereLoyaltyItemsUpdated = true;
          return true;
        }
      });
    }
  }

  const env =
    process.env.NODE_ENV == 'development'
      ? Environment.Sandbox
      : Environment.Production;

  if (wereLoyaltyItemsUpdated) {
    const client = new Client({
      accessToken: token,
      environment: env,
    });
    const { loyaltyApi } = client;

    let loyaltyProgramResponse = await loyaltyApi.retrieveLoyaltyProgram(
      'main',
    );
    console.log('response: ' + loyaltyProgramResponse?.result);

    const loyaltyProgram = loyaltyProgramResponse?.result?.program;

    if (loyaltyProgram) {
      getCatalogItemIdMapFromAccurals(
        token,
        loyaltyProgram.accrualRules ?? [],
        function (catalogItemNameMap: Map<string, string>) {
          console.log(
            'Catalog items used by loyalty have changes, so updating loyalty',
          );
          updateLoyaltyWithLatestChanges(
            businessId,
            loyaltyProgram,
            catalogItemNameMap,
            function (wasSuccessful: boolean) {
              callback(true);
            },
          );
        },
      );
    } else {
      callback(true);
    }
  } else {
    console.log('No catalog items have changed since last update');
    callback(true);
  }
};

const updateLoyaltyWithLatestChanges = async (
  businessId: string,
  loyaltyProgram: LoyaltyProgram,
  catalogItemNameMap: Map<string, string>,
  callback: any,
) => {
  if (loyaltyProgram.accrualRules && loyaltyProgram.terminology) {
    let loyalty = await AppDataSource.manager.findOne(Loyalty, {
      where: {
        businessId: businessId,
      },
    });
    if (loyalty) {
      updateAppLoyaltyAccrualsFromMerchant(
        loyaltyProgram.accrualRules,
        loyaltyProgram.terminology,
        loyalty,
        catalogItemNameMap,
      );
      removeOldAccrualRules(loyalty.loyaltyAccruals, loyaltyProgram);

      let loyaltyUsesCatalogItems = false;
      for (var loyaltyAccrualRule of loyaltyProgram.accrualRules) {
        if (
          loyaltyAccrualRule.accrualType == 'CATEGORY' ||
          loyaltyAccrualRule.accrualType == 'ITEM_VARIATION'
        )
          loyaltyUsesCatalogItems = true;
      }
      updateBusinessLoyaltyCatalogIndicator(
        businessId,
        loyaltyUsesCatalogItems,
      );
      console.log('sending callback');
      callback(true);
    } else {
      callback(true);
    }
  } else {
    callback(true);
  }
};

const getCatalogItemsLastUpdated = async (
  lastUpdateDate: Date,
  token: string,
  callback: any,
) => {
  console.log('inside getCatalogItemsLastUpdated');

  console.log('looking up catalog changes with token: ' + token);

  const lastUpdateDateIso = lastUpdateDate.toISOString();

  const env =
    process.env.NODE_ENV == 'development'
      ? Environment.Sandbox
      : Environment.Production;

  const client = new Client({
    accessToken: token,
    environment: env,
  });

  const body: SearchCatalogObjectsRequest = {
    objectTypes: ['ITEM', 'CATEGORY'],
    beginTime: lastUpdateDateIso,
    includeDeletedObjects: true,
    includeRelatedObjects: true,
  };

  const { catalogApi } = client;

  console.log('Getting catalog changes since ' + lastUpdateDateIso);
  const catalogResults = await catalogApi.searchCatalogObjects(body);

  let catalogMap = new Map<string, any>();
  let wereVariantsMission = false;

  if (catalogResults.result.objects) {
    for (var object of catalogResults.result.objects) {
      if (object.type == 'CATEGORY') {
        catalogMap.set(object.id, object);
        console.log(
          'got type: ' +
            object.type +
            ', id: ' +
            object.id +
            ', isDeleted: ' +
            object.isDeleted +
            ', category name: ' +
            object.categoryData?.name,
        );
      } else if (object.type == 'ITEM') {
        catalogMap.set(object.id, object);
        if (object.itemData?.variations) {
          for (var variant of object.itemData.variations) {
            catalogMap.set(variant.id, object);
            console.log(
              'got type: ' +
                object.type +
                ', id: ' +
                object.id +
                ', isDeleted: ' +
                object.isDeleted +
                ', item name: ' +
                object.itemData?.name,
            );
          }
        } else {
          wereVariantsMission = true;
          console.log(
            'variant was missing from ITEM in searchCatalogObjects results',
          );
        }
      }
    }
  }
  if (catalogResults.result.relatedObjects) {
    for (var relatedObject of catalogResults.result.relatedObjects) {
      if (relatedObject.type == 'IMAGE') {
        catalogMap.set(relatedObject.id, relatedObject);
        console.log(
          'got related type: ' +
            relatedObject.type +
            ', id: ' +
            relatedObject.id +
            ', isDeleted: ' +
            relatedObject.isDeleted +
            ', category name: ' +
            relatedObject.imageData?.url,
        );
      }
    }
  }
  callback([catalogMap, wereVariantsMission]);
};

module.exports = {
  deleteExistingSpecial,
  getAllSpecials,
  createSpecial,
  updateExistingSpecial,
  updateSpecialsFromWebhook,
};
