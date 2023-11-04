import {
  LoyaltyProgram,
  LoyaltyProgramAccrualRule,
  LoyaltyProgramRewardTier,
  LoyaltyPromotion,
  LoyaltyProgramTerminology,
} from 'square';
import { Loyalty } from '../entity/Loyalty';
import { LoyaltyAccrual } from '../entity/LoyaltyAccrual';
import { LoyaltyRewardTier } from '../entity/LoyaltyRewardTier';
import { Promotion } from '../entity/Promotion';
import { AppDataSource } from '../../appDataSource';
import {
  SquareAccrualRules,
  SquareLoyaltyProgram,
  SquareLoyaltyPromotion,
  SquareRewardTier,
  SquareTerminology,
} from './entity/SquareWebhook';
import { Business } from '../entity/Business';
import { decryptToken } from './EncryptionService';
import { getCatalogItemIdMapFromAccurals } from './MerchantService';

export enum LoyaltyStatusType {
  Active = 'Active',
  Inactive = 'Inactive',
}

export const updateLoyaltyFromWebhook = async (
  merchantId: string,
  webhookLoyaltyProgram: SquareLoyaltyProgram,
  callback: any,
) => {
  console.log('inside updateLoyaltyFromWebhook');

  const business = await Business.createQueryBuilder('business')
    .where('business.merchantId = :merchantId', { merchantId: merchantId })
    .getOne();

  if (!business) {
    console.log("Can't find Business for merchantId: " + merchantId);
    callback(false);
    return;
  }

  const token = decryptToken(business.merchantAccessToken);

  if (!token) {
    console.log("Can't get token");
    callback(false);
    return;
  }

  let loyalty = await AppDataSource.manager.findOne(Loyalty, {
    where: {
      businessId: business?.businessId,
    },
  });

  if (!loyalty) {
    console.log('Creating new Loyalty for webhook update');
    loyalty = Loyalty.create({
      showLoyaltyInApp: false,
      showPromotionsInApp: false,
      automaticallyUpdateChangesFromMerchant: false,
      loyaltyStatus: 'Inactive',
      terminologyOne: 'Pont',
      terminologyMany: 'Points',
      businessId: business.businessId,
      createDate: new Date(),
    });
    await AppDataSource.manager.save(loyalty);
  } else {
    console.log('got loyalty: ' + loyalty);
  }

  if (!loyalty) {
    console.log('Unable to create new Loyalty for webhook');
    callback(false);
    return;
  }

  let status = webhookLoyaltyProgram.status.toLowerCase();
  // capitalize first letter of status
  loyalty.loyaltyStatus = status.charAt(0).toUpperCase() + status.slice(1);

  loyalty.terminologyOne = webhookLoyaltyProgram.terminology?.one ?? 'Point';
  loyalty.terminologyMany =
    webhookLoyaltyProgram.terminology?.other ?? 'Points';

  loyalty.locations = [];
  if (webhookLoyaltyProgram.locationIds) {
    for (var webhookLocationId of webhookLoyaltyProgram.locationIds) {
      loyalty.locations.push(webhookLocationId);
    }
  }
  loyalty.lastUpdateDate = new Date();

  console.log('about to save loyalty');
  await AppDataSource.manager.save(loyalty);

  // Update Reward Tiers
  if (webhookLoyaltyProgram.rewardTiers && webhookLoyaltyProgram.terminology) {
    updateAppLoyaltyRewardTiersFromMerchant(
      webhookLoyaltyProgram.rewardTiers,
      webhookLoyaltyProgram.terminology,
      loyalty,
    );
  }

  if (webhookLoyaltyProgram.accrualRules && webhookLoyaltyProgram.terminology) {
    getCatalogItemIdMapFromAccurals(
      token!,
      webhookLoyaltyProgram.accrualRules!,
      function (catalogItemNameMap: Map<string, string>) {
        updateAppLoyaltyAccrualsFromMerchant(
          webhookLoyaltyProgram.accrualRules!,
          webhookLoyaltyProgram.terminology!,
          loyalty!,
          catalogItemNameMap,
        );
        cleanUpLoyaltyAndSaveChanges(
          loyalty!,
          webhookLoyaltyProgram,
          function (wasSuccessful: boolean) {
            callback(wasSuccessful);
          },
        );
      },
    );
  } else {
    cleanUpLoyaltyAndSaveChanges(
      loyalty!,
      webhookLoyaltyProgram,
      function (wasSuccessful: boolean) {
        callback(wasSuccessful);
      },
    );
  }
};

const cleanUpLoyaltyAndSaveChanges = async (
  loyalty: Loyalty,
  webhookLoyaltyProgram: SquareLoyaltyProgram,
  callback: any,
) => {
  console.log('inside cleanUpLoyaltyAndSaveChanges');

  //Now let's remove old accrual rows from the db that are no longer in the loyalty program
  if (loyalty?.loyaltyAccruals) {
    removeOldAccrualRules(loyalty.loyaltyAccruals, webhookLoyaltyProgram);
  }
  //Remove old reward tier rows
  if (loyalty?.loyaltyRewardTiers) {
    removeOldRewardTiers(loyalty.loyaltyRewardTiers, webhookLoyaltyProgram);
  }
  callback(true);
};

export const updatePromotionsFromWebhook = async (
  merchantId: string,
  webhookLoyaltyPrmotion: SquareLoyaltyPromotion,
  callback: any,
) => {
  console.log('inside updatePromotionsFromWebhook');

  const business = await Business.createQueryBuilder('business')
    .where('business.merchantId = :merchantId', { merchantId: merchantId })
    .getOne();

  if (!business) {
    console.log("Can't find Business for merchantId: " + merchantId);
    callback(false);
    return;
  }

  let loyalty = await AppDataSource.manager.findOne(Loyalty, {
    where: {
      businessId: business?.businessId,
    },
  });
  if (loyalty) {
    loyalty.lastUpdateDate = new Date();
    console.log('updating lastUpdateDate on loyalty');
    await AppDataSource.manager.save(loyalty);
  }

  let promotion = await AppDataSource.manager.findOne(Promotion, {
    where: {
      promotionId: webhookLoyaltyPrmotion.id,
    },
  });

  if (promotion) {
    if (
      webhookLoyaltyPrmotion.status == 'ACTIVE' ||
      webhookLoyaltyPrmotion.status == 'SCHEDULED'
    ) {
      updatePromotion(
        webhookLoyaltyPrmotion,
        promotion,
        promotion.displayName ?? undefined,
      );
      callback(true);
    } else {
      deletePromotion(promotion.id);
      callback(true);
    }
  } else {
    const existingLoyalty = await Loyalty.createQueryBuilder('loyalty')
      .where('loyalty.businessId = :businessId', {
        businessId: business.businessId,
      })
      .getOne();
    if (existingLoyalty) {
      createPromotion(webhookLoyaltyPrmotion, existingLoyalty.id);
      callback(true);
    } else {
      console.log('unable to find loyalty for promotion');
      callback(false);
    }
  }
};

export const createAppLoyaltyFromLoyaltyProgram = async (
  businessId: string,
  loyaltyProgram: LoyaltyProgram,
  loyaltyPromotions: LoyaltyPromotion[],
  catalogItemNameMap: Map<string, string>,
  callback: any,
) => {
  if (!loyaltyProgram.terminology) {
    console.log('terminology missing in createAppLoyaltyFromLoyaltyProgram');
    callback(undefined);
    return;
  }

  const loyalty = AppDataSource.manager.create(Loyalty, {
    showLoyaltyInApp: true,
    showPromotionsInApp: true,
    automaticallyUpdateChangesFromMerchant: true,
    loyaltyStatus: 'Active',
    terminologyOne: loyaltyProgram.terminology?.one,
    terminologyMany: loyaltyProgram.terminology?.other,
    businessId: businessId,
    createDate: new Date(),
  });
  await AppDataSource.manager.save(loyalty);

  console.log('created new loyalty with id: ' + loyalty.id);

  const loyaltyId = loyalty.id;
  // var accrualRules: LoyaltyAccrual[] = [];
  if (loyaltyProgram.accrualRules) {
    loyaltyProgram.accrualRules.forEach(function (loyaltyAccrualRule) {
      createAccrual(
        loyaltyAccrualRule,
        catalogItemNameMap,
        loyaltyProgram.terminology!,
        loyaltyId,
      );
    });
  }

  if (loyaltyProgram.rewardTiers) {
    loyaltyProgram.rewardTiers.forEach(function (loyaltyRewardTier) {
      if (loyaltyRewardTier.id && loyaltyProgram.terminology) {
        createRewardTier(
          loyaltyRewardTier,
          loyaltyProgram.terminology!,
          loyaltyId,
        );
      }
    });
  }

  // var promotions: Promotion[] = [];
  if (loyaltyPromotions) {
    loyaltyPromotions.forEach(function (loyaltyPromotion) {
      createPromotion(loyaltyPromotion, loyaltyId);
    });
  }
  callback(loyalty);
};

export const isLoyaltyOrPromotionsOutOfDate = (
  loyalty: Loyalty,
  loyaltyProgram: LoyaltyProgram,
  promotions: LoyaltyPromotion[],
) => {
  // First check if loyalty program is out of date
  var loyaltyProgramUpdatedAt: Date | undefined;
  if (loyaltyProgram.updatedAt) {
    loyaltyProgramUpdatedAt = new Date(loyaltyProgram.updatedAt);
  }
  var appLoyaltyUpdatedAt: Date | undefined;
  if (loyalty.lastUpdateDate) {
    appLoyaltyUpdatedAt = loyalty.lastUpdateDate;
  } else if (loyalty.createDate) {
    appLoyaltyUpdatedAt = loyalty.createDate;
  }
  if (loyaltyProgramUpdatedAt && appLoyaltyUpdatedAt) {
    console.log(
      'comparing loyaltyProgramUpdatedAt:' +
        loyaltyProgramUpdatedAt +
        ' to appLoyaltyUpdatedAt: ' +
        appLoyaltyUpdatedAt,
    );
    if (appLoyaltyUpdatedAt.getTime() < loyaltyProgramUpdatedAt.getTime()) {
      return true;
    }
  }

  /// Now check all promotions to see if they're out of date, removed or new promos have been added
  console.log('promotions length: ' + promotions.length);
  for (var loyaltyPromotion of promotions) {
    console.log('checking promo ' + loyaltyPromotion.id);
    if (loyaltyPromotion.id && loyalty.promotions) {
      var wasPromoFound = false;
      for (var appPromotion of loyalty.promotions) {
        console.log('appPromotion.promotionId: ' + appPromotion.promotionId);
        console.log('appPromotion.merchantName: ' + appPromotion.merchantName);
        if (
          appPromotion.promotionId == loyaltyPromotion.id! &&
          appPromotion.lastUpdateDate
        ) {
          wasPromoFound = true;
          // if (appPromotion.promotionId == loyaltyPromotion.id!) {
          if (loyaltyPromotion.updatedAt) {
            var loyaltyUpdatedAt = new Date(loyaltyPromotion.updatedAt);
            if (loyaltyUpdatedAt) {
              console.log(
                'comparing lastUpdateDate:' +
                  appPromotion.lastUpdateDate +
                  ' to loyaltyUpdatedAt: ' +
                  loyaltyUpdatedAt,
              );
              if (
                appPromotion.lastUpdateDate!.getTime() <
                loyaltyUpdatedAt.getTime()
              ) {
                console.log('returning true1');
                return true;
              }
            } else {
              console.log('returning true2');
              return true;
            }
          } else {
            console.log('returning true3');
            return true;
          }
        }
      }
      if (!wasPromoFound) {
        console.log('returning true4');
        return true;
      }
    }
  }
  if (loyalty.promotions) {
    for (var appPromotion of loyalty.promotions) {
      if (appPromotion.loyaltyId) {
        console.log(
          'checking to see if appPromotion exists in loyalty promotions',
        );
        var wasPromoFound = false;
        for (var loyaltyPromotion of promotions) {
          console.log(
            'comparing loyaltyPromotion.promotionId: ' +
              loyaltyPromotion.id +
              ' to appPromotion.promotionId: ' +
              appPromotion.promotionId,
          );
          if (
            loyaltyPromotion.id &&
            loyaltyPromotion.id == appPromotion.promotionId
          ) {
            wasPromoFound = true;
            console.log('setting wasPromoFound to true');
          }
        }
        if (!wasPromoFound) {
          console.log('returning true5');
          return true;
        }
      }
    }
  }
  return false;
};

export const updateAppLoyaltyFromMerchant = async (
  loyalty: Loyalty,
  loyaltyProgram: LoyaltyProgram,
  promotions: LoyaltyPromotion[],
  catalogItemNameMap: Map<string, string>,
  callback: any,
) => {
  console.log('inside updateAppLoyaltyFromMerchant');

  const queryRunner = await AppDataSource.createQueryRunner();
  await queryRunner.startTransaction();

  try {
    loyalty.lastUpdateDate = new Date();
    await AppDataSource.manager.save(loyalty);

    if (loyaltyProgram.accrualRules && loyaltyProgram.terminology) {
      updateAppLoyaltyAccrualsFromMerchant(
        loyaltyProgram.accrualRules,
        loyaltyProgram.terminology,
        loyalty,
        catalogItemNameMap,
      );
    }

    // Update Reward Tiers
    if (loyaltyProgram.rewardTiers && loyaltyProgram.terminology) {
      var loyaltyRewardTier = updateAppLoyaltyRewardTiersFromMerchant(
        loyaltyProgram.rewardTiers,
        loyaltyProgram.terminology,
        loyalty,
      );
    }

    //Update Promotions from merchant
    if (loyaltyProgram.terminology) {
      var loyaltyPromotion = updateAppLoyaltyPromotionsFromMerchant(
        promotions,
        loyaltyProgram.terminology,
        loyalty,
      );
    }

    //Now let's remove old accrual rows from the db that are no longer in the loyalty program
    if (loyalty.loyaltyAccruals) {
      removeOldAccrualRules(loyalty.loyaltyAccruals, loyaltyProgram);
    }

    //Remove old reward tier rows
    if (loyalty.loyaltyRewardTiers) {
      removeOldRewardTiers(loyalty.loyaltyRewardTiers, loyaltyProgram);
    }

    //Remove old promotion rows
    if (loyalty.promotions) {
      removeOldPromotions(loyalty, promotions);
    }

    await queryRunner.commitTransaction();
    callback(loyalty);
  } catch (err) {
    console.log('error in updateAppLoyaltyFromMerchant: ' + err);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
  }
};

export const updateLoyaltyStatuses = async (
  businessId: string,
  loyaltyId: string,
  showLoyaltyInApp: boolean,
  showPromotionsInApp: boolean,
  automaticallyUpdateChangesFromMerchant: boolean,
  loyaltyStatus: string,
  callback: any,
) => {
  console.log('inside updateLoyaltyStatus');

  console.log('showLoyaltyInApp: ' + showLoyaltyInApp);

  const existingLoyalty = await Loyalty.createQueryBuilder('loyalty')
    .where('loyalty.businessId = :businessId', { businessId: businessId })
    .getOne();

  if (existingLoyalty && existingLoyalty.id == loyaltyId) {
    await Loyalty.update(existingLoyalty.id, {
      showLoyaltyInApp: showLoyaltyInApp,
      showPromotionsInApp: showPromotionsInApp,
      automaticallyUpdateChangesFromMerchant:
        automaticallyUpdateChangesFromMerchant,
      loyaltyStatus: loyaltyStatus,
      lastUpdateDate: new Date(),
    });
    callback(true);
  } else {
    console.log('existingLoyalty not found');
  }
};

export const updateLoyaltyItems = async (
  businessId: string,
  loyaltyId: string,
  loyaltyAccruals: LoyaltyAccrual[] | undefined,
  promotions: Promotion[] | undefined,
  loyaltyRewardTiers: LoyaltyRewardTier[] | undefined,
  callback: any,
) => {
  console.log('inside updateLoyaltyItems');

  const existingLoyalty = await Loyalty.findOne({
    where: {
      id: loyaltyId,
    },
  });
  if (!existingLoyalty) {
    console.log('loyaltyId: ' + loyaltyId + ' not found');
    callback(false);
  }

  const queryRunner = await AppDataSource.createQueryRunner();
  await queryRunner.startTransaction();

  try {
    if (loyaltyAccruals) {
      for (var loyaltyAccrual of loyaltyAccruals) {
        var matches = existingLoyalty?.loyaltyAccruals?.filter(
          (accrual) => accrual.id == loyaltyAccrual.id,
        );
        if (matches && matches.length > 0) {
          if (
            matches[0].displayEarningPointsDescription !=
              loyaltyAccrual.displayEarningPointsDescription ||
            matches[0].displayEarningAdditionalEarningPointsDescription !=
              loyaltyAccrual.displayEarningAdditionalEarningPointsDescription
          ) {
            console.log(
              'loyaltyAccrual will be updated for id: ' + loyaltyAccrual.id,
            );

            await LoyaltyAccrual.update(loyaltyAccrual.id, {
              displayEarningPointsDescription:
                loyaltyAccrual.displayEarningPointsDescription,
              displayEarningAdditionalEarningPointsDescription:
                loyaltyAccrual.displayEarningAdditionalEarningPointsDescription,
              lastUpdateDate: new Date(),
            });
          }
        }
      }
    }

    if (promotions) {
      for (var promotion of promotions) {
        var promotionMatches = existingLoyalty?.promotions?.filter(
          (existingPromotion) => existingPromotion.id == promotion.id,
        );
        if (promotionMatches && promotionMatches.length > 0) {
          if (promotionMatches[0].displayName != promotion.displayName) {
            console.log('promotion will be updated for id: ' + promotion.id);

            await Promotion.update(promotion.id, {
              displayName: promotion.displayName,
              lastUpdateDate: new Date(),
            });
          }
        }
      }
    }

    if (loyaltyRewardTiers) {
      for (var loyaltyRewardTier of loyaltyRewardTiers) {
        var rewardTierMatches = existingLoyalty?.loyaltyRewardTiers?.filter(
          (existingRewardTier) => existingRewardTier.id == loyaltyRewardTier.id,
        );
        if (rewardTierMatches && rewardTierMatches.length > 0) {
          if (
            rewardTierMatches[0].displayReward !=
              loyaltyRewardTier.displayReward ||
            rewardTierMatches[0].displayRewardDescription !=
              loyaltyRewardTier.displayRewardDescription
          ) {
            console.log(
              'loyaltyRewardTier will be updated for id: ' +
                loyaltyRewardTier.id,
            );

            await LoyaltyRewardTier.update(loyaltyRewardTier.id, {
              displayReward: loyaltyRewardTier.displayReward,
              displayRewardDescription:
                loyaltyRewardTier.displayRewardDescription,
              lastUpdateDate: new Date(),
            });
          }
        }
      }
    }
    await queryRunner.commitTransaction();
    callback(true);
  } catch (err) {
    console.log('error in updateLoyaltyItems: ' + err);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
  }
};

const deleteAccrual = async (accrualId: string) => {
  await AppDataSource.manager.delete(LoyaltyAccrual, accrualId);
  console.log('just deleted accral with id:' + accrualId);
};

const deleteRewardTier = async (rewardTierId: string) => {
  await AppDataSource.manager.delete(LoyaltyRewardTier, rewardTierId);
  console.log('just deleted reward tier with id:' + rewardTierId);
};

const deletePromotion = async (promotionId: string) => {
  await AppDataSource.manager.delete(Promotion, promotionId);
  console.log('just deleted promotion with id:' + promotionId);
};

const createAccrual = async (
  loyaltyAccrualRule: LoyaltyProgramAccrualRule | SquareAccrualRules,
  catalogItemNameMap: Map<string, string>,
  terminology: LoyaltyProgramTerminology | SquareTerminology,
  loyaltyId: string,
) => {
  var itemName: string | null | undefined = undefined;
  if (loyaltyAccrualRule.categoryData?.categoryId) {
    itemName = catalogItemNameMap.get(
      loyaltyAccrualRule.categoryData!.categoryId,
    );
  } else if (loyaltyAccrualRule.itemVariationData?.itemVariationId) {
    itemName = catalogItemNameMap.get(
      loyaltyAccrualRule.itemVariationData.itemVariationId,
    );
  }
  const ruleValues = rewardsRuleValue(
    loyaltyAccrualRule,
    itemName,
    terminology,
  );
  console.log('ruleValues: ' + ruleValues);

  const accrual = AppDataSource.manager.create(LoyaltyAccrual, {
    loyaltyId: loyaltyId,
    accrualType: loyaltyAccrualRule.accrualType,
    categoryId: loyaltyAccrualRule.categoryData?.categoryId,
    variantId: loyaltyAccrualRule.itemVariationData?.itemVariationId,
    merchantEarningPointsDescription: ruleValues[0],
    merchantAdditionalEarningPointsDescription: ruleValues[1],
  });
  await AppDataSource.manager.save(accrual);
  console.log('just created accral with id:' + accrual.id);
};

const updateAccrual = async (
  loyaltyAccrualRule: LoyaltyProgramAccrualRule | SquareAccrualRules,
  catalogItemNameMap: Map<string, string>,
  terminology: LoyaltyProgramTerminology | SquareTerminology,
  loyaltyId: string,
  existingAppAccural: LoyaltyAccrual,
  displayEarningPointsDescription: string | undefined,
  displayAdditionalEarningPointsDescription: string | undefined,
) => {
  console.log('inside updateAccrual');

  var itemName: string | null | undefined = undefined;
  if (loyaltyAccrualRule.categoryData?.categoryId) {
    itemName = catalogItemNameMap.get(
      loyaltyAccrualRule.categoryData!.categoryId,
    );
  } else if (loyaltyAccrualRule.itemVariationData?.itemVariationId) {
    itemName = catalogItemNameMap.get(
      loyaltyAccrualRule.itemVariationData.itemVariationId,
    );
  }
  const ruleValues = rewardsRuleValue(
    loyaltyAccrualRule,
    itemName,
    terminology,
  );
  console.log('ruleValues: ' + ruleValues);

  console.log(
    'existingAppAccural.displayEarningAdditionalEarningPointsDescription = ' +
      existingAppAccural.displayEarningAdditionalEarningPointsDescription,
  );

  await AppDataSource.manager.update(
    LoyaltyAccrual,
    {
      id: existingAppAccural.id,
    },
    {
      accrualType: loyaltyAccrualRule.accrualType,
      categoryId: loyaltyAccrualRule.categoryData?.categoryId ?? undefined,
      variantId:
        loyaltyAccrualRule.itemVariationData?.itemVariationId ?? undefined,
      merchantEarningPointsDescription: ruleValues[0],
      merchantAdditionalEarningPointsDescription: ruleValues[1],
      displayEarningPointsDescription: displayEarningPointsDescription ?? null,
      displayEarningAdditionalEarningPointsDescription:
        displayAdditionalEarningPointsDescription ?? null,
      lastUpdateDate: new Date(),
    },
  );
  console.log('just updated loyatyAccrual with id:' + existingAppAccural.id);
};

const createRewardTier = async (
  loyaltyRewardTier: LoyaltyProgramRewardTier | SquareRewardTier,
  terminology: LoyaltyProgramTerminology | SquareTerminology,
  loyaltyId: string,
) => {
  console.log('inside createRewardTier');
  const rewardTier = AppDataSource.manager.create(LoyaltyRewardTier, {
    loyaltyId: loyaltyId,
    rewardTierId: loyaltyRewardTier.id,
    merchantReward: getRewardValue(loyaltyRewardTier, terminology),
    merchantRewardDescription: loyaltyRewardTier.name,
  });
  // rewardTiers.push(rewardTier);
  await AppDataSource.manager.save(rewardTier);
  console.log('just created rewardTier with id:' + rewardTier.id);
};

const updateRewardTier = async (
  loyaltyRewardTier: LoyaltyProgramRewardTier | SquareRewardTier,
  terminology: LoyaltyProgramTerminology | SquareTerminology,
  loyaltyId: string,
  existingAppRewardTier: LoyaltyRewardTier,
  displayRewardDescription: string | undefined,
) => {
  AppDataSource.manager.update(
    LoyaltyRewardTier,
    {
      id: existingAppRewardTier.id,
    },
    {
      merchantReward: getRewardValue(loyaltyRewardTier, terminology),
      merchantRewardDescription: loyaltyRewardTier.name,
      displayReward: existingAppRewardTier.displayReward ?? null,
      displayRewardDescription: displayRewardDescription ?? null,
      lastUpdateDate: new Date(),
    },
  );
  console.log('just updaated rewardTier with id:' + existingAppRewardTier.id);
};

const createPromotion = async (
  loyaltyPromotion: LoyaltyPromotion | SquareLoyaltyPromotion,
  loyaltyId: string,
) => {
  var startsOn: Date | undefined;
  if (loyaltyPromotion.availableTime.startDate) {
    startsOn = new Date(loyaltyPromotion.availableTime.startDate!);
  }
  const promotion = AppDataSource.manager.create(Promotion, {
    loyaltyId: loyaltyId,
    promotionId: loyaltyPromotion.id,
    status: loyaltyPromotion.status,
    merchantName: loyaltyPromotion.name,
    promotionStartsOn: startsOn,
  });
  // promotions.push(promotion);
  await AppDataSource.manager.save(promotion);
  console.log('just created promotion with id: ' + promotion.id);
};

const updatePromotion = async (
  loyaltyPromotion: LoyaltyPromotion | SquareLoyaltyPromotion,
  existingPromotion: Promotion,
  displayName: string | undefined,
) => {
  var startsOn: Date | undefined;
  if (loyaltyPromotion.availableTime.startDate) {
    startsOn = new Date(loyaltyPromotion.availableTime.startDate!);
  }
  AppDataSource.manager.update(
    Promotion,
    {
      id: existingPromotion.id,
    },
    {
      status: loyaltyPromotion.status,
      merchantName: loyaltyPromotion.name,
      promotionStartsOn: startsOn,
      displayName: displayName ?? null,
      lastUpdateDate: new Date(),
    },
  );
  console.log('just updated promotion with id: ' + existingPromotion.id);
};

const rewardsRuleValue = (
  accrualRule: LoyaltyProgramAccrualRule | SquareAccrualRules,
  itemName: string | null | undefined,
  terminology: LoyaltyProgramTerminology | SquareTerminology,
) => {
  console.log(
    'inside rewardsRuleValue with accrualType of ' + accrualRule.accrualType,
  );
  switch (accrualRule.accrualType) {
    case 'VISIT':
      console.log('rewardsRuleValue type is VISIT');
      var visitRuleDescription =
        rewardsPointsEarned(accrualRule.points, terminology) +
        ' for every visit. ';
      if (
        accrualRule.visitData?.minimumAmountMoney &&
        accrualRule.visitData?.minimumAmountMoney?.amount
      ) {
        const currency =
          accrualRule.visitData?.minimumAmountMoney.currency ?? 'USD';
        const amount = accrualRule.visitData?.minimumAmountMoney?.amount;

        if (amount && currency) {
          const currencyType = getMoneyCurrencyType(currency);
          if (currencyType) {
            const adjustedAmount = Number(amount) / 100.0;
            const showCents = Number(amount) % 100.0 > 0;
            const ruleMinimum = adjustedAmount.toLocaleString(currencyType, {
              style: 'currency',
              currency: currency,
              maximumFractionDigits: showCents ? 2 : 0,
            });
            visitRuleDescription += ruleMinimum + ' minimum purchase.';
          }
        }
      }
      return [visitRuleDescription, ''];

    case 'SPEND':
      console.log('rewardsRuleValue type is SPEND');
      var additionalDescription = '';
      const amount = accrualRule.spendData?.amountMoney?.amount;
      const currency = accrualRule.spendData?.amountMoney?.currency ?? 'USD';
      if (amount && currency) {
        console.log('got amount and currency');
        const currencyType = getMoneyCurrencyType(currency);
        if (currencyType) {
          const adjustedAmount = Number(amount) / 100.0;
          const showCents = Number(amount) % 100.0 > 0;
          const ruleAmount = adjustedAmount.toLocaleString(currencyType, {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: showCents ? 2 : 0,
          });
          var spendRuleDescription = rewardsPointsEarned(
            accrualRule.points,
            terminology,
          );
          spendRuleDescription +=
            ' for every ' + ruleAmount + ' spent in a single transaction.';
          const excludedItemVariationIds =
            accrualRule.spendData?.excludedItemVariationIds;
          const excludedCategoryIds =
            accrualRule.spendData?.excludedCategoryIds;
          if (
            (excludedItemVariationIds && excludedItemVariationIds.length > 0) ||
            (excludedCategoryIds && excludedCategoryIds.length > 0)
          ) {
            additionalDescription =
              'Certain items are excluded from earning Stars';
          }
          return [spendRuleDescription, additionalDescription];
        }
      } else {
        console.log('missing amount or currency');
      }
      return ['', ''];

    case 'CATEGORY':
      console.log('rewardsRuleValue type is CATEGORY');
      const ruleDescription = rewardsPointsEarned(
        accrualRule.points,
        terminology,
      );
      const name = itemName ?? '';
      return [
        ruleDescription + ' for any item in ' + name + ' purchased',
        undefined,
      ];

    case 'ITEM_VARIATION':
      console.log('rewardsRuleValue type is ITEM with itemName: ' + itemName);
      const purchasedItemName = itemName
        ? ' for every ' + itemName
        : ' for certain items ';
      const itemRuleDescription =
        rewardsPointsEarned(accrualRule.points, terminology) +
        purchasedItemName +
        ' purchased.';
      return [itemRuleDescription, ''];
  }
  return [undefined, undefined];
};

const MoneyCurrencyType = {
  USD: 'en-US',
};

const getMoneyCurrencyType = (type: any) => {
  if (type == 'USD') {
    return MoneyCurrencyType.USD;
  }
  return null;
};

const rewardsPointsEarned = (
  loyaltyPoints: number | null | undefined,
  terminology: LoyaltyProgramTerminology | SquareTerminology,
) => {
  var ruleDescription = 'Earn ';
  const points = loyaltyPoints ?? 0;
  return (
    ruleDescription +
    String(points) +
    ' ' +
    (points > 1 ? terminology.other : terminology.one)
  );
};

const getRewardValue = (
  rewardTier: LoyaltyProgramRewardTier | SquareRewardTier,
  terminology: LoyaltyProgramTerminology | SquareTerminology,
) => {
  return (
    String(rewardTier.points) +
    ' ' +
    (rewardTier.points > 1 ? terminology.other : terminology.one)
  );
};

function removeOldPromotions(loyalty: Loyalty, promotions: LoyaltyPromotion[]) {
  for (var appPromotion of loyalty.promotions) {
    var wasPromotionFound = false;
    for (var loyaltyPromotion of promotions) {
      if (loyaltyPromotion.id) {
        if (appPromotion.promotionId == loyaltyPromotion.id) {
          wasPromotionFound = true;
          console.log('found promotion');
        }
      }
    }
    if (!wasPromotionFound) {
      console.log('need to delete promotion: ' + appPromotion.id);
      deletePromotion(appPromotion.id);
    }
  }
}

function removeOldRewardTiers(
  loyaltyRewardTiers: LoyaltyRewardTier[],
  loyaltyProgram: LoyaltyProgram | SquareLoyaltyProgram,
) {
  console.log('inside removeOldRewardTiers');
  for (var appRewardTier of loyaltyRewardTiers) {
    var wasRewardTierFound = false;
    if (loyaltyProgram.rewardTiers) {
      for (var loyaltyRewardTier of loyaltyProgram.rewardTiers) {
        if (loyaltyRewardTier.id) {
          if (appRewardTier.rewardTierId == loyaltyRewardTier.id) {
            wasRewardTierFound = true;
            console.log('found rewardTier');
          }
        }
      }
    }
    if (!wasRewardTierFound) {
      console.log('need to delete rewardTier: ' + appRewardTier.id);
      deleteRewardTier(appRewardTier.id);
    }
  }
}

function removeOldAccrualRules(
  loyaltyAccruals: LoyaltyAccrual[],
  loyaltyProgram: LoyaltyProgram | SquareLoyaltyProgram,
) {
  console.log('inside removeOldAccrualRules');
  for (var appLoyaltyAccrual of loyaltyAccruals) {
    var wasAccrualFound = false;
    // Look up accrual in currenty loyalty program
    if (loyaltyProgram.accrualRules && loyaltyProgram.terminology) {
      for (var loyaltyAccrualRule of loyaltyProgram.accrualRules) {
        if (
          loyaltyAccrualRule.accrualType == 'ITEM_VARIATION' &&
          appLoyaltyAccrual.accrualType == 'ITEM_VARIATION'
        ) {
          if (
            loyaltyAccrualRule.itemVariationData?.itemVariationId ==
            appLoyaltyAccrual.variantId
          ) {
            wasAccrualFound = true;
          }
        } else if (
          loyaltyAccrualRule.accrualType == 'CATEGORY' &&
          appLoyaltyAccrual.accrualType == 'CATEGORY'
        ) {
          if (
            loyaltyAccrualRule.categoryData?.categoryId ==
            appLoyaltyAccrual.categoryId
          ) {
            wasAccrualFound = true;
            console.log('got a match on Category accrual');
          }
        } else if (
          loyaltyAccrualRule.accrualType == 'VISIT' &&
          appLoyaltyAccrual.accrualType == 'VISIT'
        ) {
          wasAccrualFound = true;
        } else if (
          loyaltyAccrualRule.accrualType == 'SPEND' &&
          appLoyaltyAccrual.accrualType == 'SPEND'
        ) {
          wasAccrualFound = true;
        }
      }
    }
    if (!wasAccrualFound) {
      console.log('need to delete accrualId: ' + appLoyaltyAccrual.id);
      deleteAccrual(appLoyaltyAccrual.id);
    }
  }
}

function updateAppLoyaltyPromotionsFromMerchant(
  promotions: LoyaltyPromotion[],
  terminology: LoyaltyProgramTerminology,
  loyalty: Loyalty,
) {
  console.log('inside updateAppLoyaltyPromotionsFromMerchant');

  for (var loyaltyPromotion of promotions) {
    var existingPromotion: Promotion | undefined = undefined;
    var displayName: string | undefined = undefined;
    if (loyalty.promotions && loyaltyPromotion.id) {
      console.log(
        'searching loyalty.promotions for loyaltyPromotion.promotionId' +
          loyaltyPromotion.id,
      );
      var promoMatches = loyalty.promotions!.filter(
        (promo) => promo.promotionId == loyaltyPromotion.id!,
      );
      if (promoMatches && promoMatches.length > 0) {
        existingPromotion = promoMatches[0];
        displayName = existingPromotion.displayName ?? undefined;
      }
    }
    console.log('existingPromotion: ' + existingPromotion);
    if (existingPromotion) {
      // Remove overriden name if the merchant name has changed since we overrode it
      if (
        existingPromotion!.merchantName &&
        loyaltyPromotion.name != existingPromotion.merchantName
      ) {
        displayName = undefined;
      }
    }
    if (existingPromotion) {
      updatePromotion(loyaltyPromotion, existingPromotion, displayName);
    } else {
      createPromotion(loyaltyPromotion, loyalty.id);
    }
  }
  // return loyaltyPromotion;
}

function updateAppLoyaltyRewardTiersFromMerchant(
  loyaltyProgramRewardTiers: LoyaltyProgramRewardTier[] | SquareRewardTier[],
  terminology: LoyaltyProgramTerminology | SquareTerminology,
  loyalty: Loyalty,
) {
  console.log('inside updateAppLoyaltyRewardTiersFromMerchant');

  for (var loyaltyRewardTier of loyaltyProgramRewardTiers) {
    var existingAppRewardTier: LoyaltyRewardTier | undefined = undefined;
    var displayRewardDescription: string | undefined = undefined;
    if (loyalty.loyaltyRewardTiers && loyaltyRewardTier.id) {
      console.log(
        'searching loyaltyRewardTiers for loyaltyRewardTier.id' +
          loyaltyRewardTier.id,
      );
      var tierMatches = loyalty.loyaltyRewardTiers!.filter(
        (rewardTier) => rewardTier.rewardTierId == loyaltyRewardTier.id!,
      );
      if (tierMatches && tierMatches.length > 0) {
        existingAppRewardTier = tierMatches[0];
        displayRewardDescription =
          tierMatches[0].displayRewardDescription ?? undefined;
      }
    }
    console.log('existingAppRewardTier: ' + existingAppRewardTier);
    console.log(
      'comparing existingAppRewardTier?.merchantRewardDescription: ' +
        existingAppRewardTier?.merchantRewardDescription +
        ' to loyaltyRewardTier.name: ' +
        loyaltyRewardTier.name,
    );
    if (existingAppRewardTier) {
      if (
        existingAppRewardTier!.merchantRewardDescription &&
        loyaltyRewardTier.name
      ) {
        if (
          existingAppRewardTier!.merchantRewardDescription !=
          loyaltyRewardTier.name
        ) {
          console.log(
            'clearing existingAppRewardTier.displayRewardDescription',
          );
          displayRewardDescription = undefined;
        }
      }
    }
    if (existingAppRewardTier) {
      updateRewardTier(
        loyaltyRewardTier,
        terminology,
        loyalty.id,
        existingAppRewardTier,
        displayRewardDescription,
      );
    } else {
      createRewardTier(loyaltyRewardTier, terminology, loyalty.id);
    }
  }
  // return loyaltyRewardTier;
}

function updateAppLoyaltyAccrualsFromMerchant(
  loyaltyProgramAccrualRules:
    | LoyaltyProgramAccrualRule[]
    | SquareAccrualRules[],
  terminology: LoyaltyProgramTerminology | SquareTerminology,
  loyalty: Loyalty,
  catalogItemNameMap: Map<string, string>,
) {
  for (var loyaltyAccrualRule of loyaltyProgramAccrualRules) {
    var existingAppAccural: LoyaltyAccrual | undefined = undefined;
    var displayEarningPointsDescription: string | undefined = undefined;
    var displayAdditionalEarningPointsDescription: string | undefined =
      undefined;
    if (loyalty.loyaltyAccruals) {
      if (loyaltyAccrualRule.accrualType == 'ITEM_VARIATION') {
        if (loyaltyAccrualRule.itemVariationData?.itemVariationId) {
          for (var appLoyaltyAccrual of loyalty.loyaltyAccruals) {
            if (
              appLoyaltyAccrual.variantId &&
              appLoyaltyAccrual.variantId ==
                loyaltyAccrualRule.itemVariationData!.itemVariationId
            ) {
              existingAppAccural = appLoyaltyAccrual;
              displayEarningPointsDescription =
                appLoyaltyAccrual.displayEarningPointsDescription ?? undefined;
              displayAdditionalEarningPointsDescription =
                appLoyaltyAccrual.displayEarningAdditionalEarningPointsDescription ??
                undefined;
            }
          }
        }
      } else if (loyaltyAccrualRule.accrualType == 'CATEGORY') {
        if (loyaltyAccrualRule.categoryData?.categoryId) {
          for (var appLoyaltyAccrual of loyalty.loyaltyAccruals) {
            if (
              appLoyaltyAccrual.categoryId &&
              appLoyaltyAccrual.categoryId ==
                loyaltyAccrualRule.categoryData!.categoryId
            ) {
              existingAppAccural = appLoyaltyAccrual;
              displayEarningPointsDescription =
                appLoyaltyAccrual.displayEarningPointsDescription ?? undefined;
              displayAdditionalEarningPointsDescription =
                appLoyaltyAccrual.displayEarningAdditionalEarningPointsDescription ??
                undefined;
            }
          }
        }
      } else {
        console.log('checking for matches');
        var matches = loyalty.loyaltyAccruals!.filter(
          (accrual) => accrual.accrualType == loyaltyAccrualRule.accrualType,
        );
        if (matches && matches.length > 0) {
          existingAppAccural = matches[0];
          displayEarningPointsDescription =
            matches[0].displayEarningPointsDescription ?? undefined;
          displayAdditionalEarningPointsDescription =
            matches[0].displayEarningAdditionalEarningPointsDescription ??
            undefined;
        }
      }
    }
    var itemName: string | null | undefined = undefined;
    if (loyaltyAccrualRule.categoryData?.categoryId) {
      itemName = catalogItemNameMap.get(
        loyaltyAccrualRule.categoryData!.categoryId,
      );
    } else if (loyaltyAccrualRule.itemVariationData?.itemVariationId) {
      itemName = catalogItemNameMap.get(
        loyaltyAccrualRule.itemVariationData.itemVariationId,
      );
    }
    const currentRuleDescriptions = rewardsRuleValue(
      loyaltyAccrualRule,
      itemName,
      terminology,
    );
    console.log('currentRuleDescriptions: ' + currentRuleDescriptions);
    console.log('existingAppAccural: ' + existingAppAccural);

    // If core description or core additional description has changed, disregard existing app accrual
    if (existingAppAccural) {
      console.log(
        'existingAppAccural!.merchantEarningPointsDescription: ' +
          existingAppAccural!.merchantEarningPointsDescription,
      );
      console.log('currentRuleDescriptions[0]: ' + currentRuleDescriptions[0]);
      if (
        existingAppAccural!.merchantEarningPointsDescription &&
        existingAppAccural!.merchantEarningPointsDescription !=
          currentRuleDescriptions[0]
      ) {
        console.log(
          'setting existingAppAccural to null1. existingAppAccural?.merchantEarningPointsDescription: ' +
            existingAppAccural?.merchantEarningPointsDescription +
            ', currentRuleDescriptions[0]: ' +
            currentRuleDescriptions[0],
        );
        displayEarningPointsDescription = undefined;
      }
      //TODO: Need to figure out why this code fails with Cannot read properties of undefined (reading 'merchantAdditionalEarningPointsDescription')
      // if (existingAppAccural!.merchantAdditionalEarningPointsDescription != undefined) {
      //   if (existingAppAccural!.merchantAdditionalEarningPointsDescription != currentRuleDescriptions[1]) {
      //     existingAppAccural = undefined;
      //     console.log("setting existingAppAccural to null2");
      //   }
      // }
    }
    if (existingAppAccural) {
      updateAccrual(
        loyaltyAccrualRule,
        catalogItemNameMap,
        terminology,
        loyalty.id,
        existingAppAccural,
        displayEarningPointsDescription,
        displayAdditionalEarningPointsDescription,
      );
    } else {
      createAccrual(
        loyaltyAccrualRule,
        catalogItemNameMap,
        terminology,
        loyalty.id,
      );
    }
  }
  // return { appLoyaltyAccrual, loyaltyAccrualRule };
}

module.exports = {
  createAppLoyaltyFromLoyaltyProgram,
  isLoyaltyOrPromotionsOutOfDate,
  updateAppLoyaltyFromMerchant,
  updateLoyaltyFromWebhook,
  updatePromotionsFromWebhook,
  updateLoyaltyItems,
  updateLoyaltyStatuses,
  LoyaltyStatusType,
};
