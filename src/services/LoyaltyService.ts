import { LoyaltyProgram, LoyaltyProgramAccrualRule, LoyaltyProgramRewardTier, LoyaltyPromotion, LoyaltyProgramTerminology } from "square";
import { Loyalty } from "../entity/Loyalty";
import { LoyaltyAccrual } from "../entity/LoyaltyAccrual";
import { LoyaltyRewardTier } from "../entity/LoyaltyRewardTier";
import { Promotion } from "../entity/Promotion";
import { EntityManager, Repository, getConnection } from 'typeorm';
import { getManager } from "typeorm";
import { v4 as uuidv4} from 'uuid';

export enum LoyaltyStatusType {
  Active = "Active",
  Inactive = "Inactive",
}

export const createAppLoyaltyFromLoyaltyProgram = async (businessId: string, loyaltyProgram: LoyaltyProgram, loyaltyPromotions: LoyaltyPromotion[], categoryIdMap: Map<string, string>, callback: any) => {

  if (!loyaltyProgram.terminology) {
    console.log("terminology missing in createAppLoyaltyFromLoyaltyProgram");
    callback(undefined);
    return;
  }

  const loyaltyRepository = getManager().getRepository(Loyalty);

  const loyalty = loyaltyRepository.create({
    showLoyaltyInApp: true,
    showPromotionsInApp: true,
    automaticallyUpdateChangesFromMerchant: true,
    loyaltyStatus: "Active",
    terminologyOne: loyaltyProgram.terminology?.one,
    terminologyMany: loyaltyProgram.terminology?.other,
    businessId: businessId,
    createDate: new Date(),
  })

  await loyaltyRepository.save(loyalty);

  console.log("created new loyalty with id: " + loyalty.id);

  const loyaltyId = loyalty.id;
  const loyaltyAccrualRepository = getManager().getRepository(LoyaltyAccrual);
  const loyaltyRewardTierRepository = getManager().getRepository(LoyaltyRewardTier);
  const promotionRepository = getManager().getRepository(Promotion);

  // const loyaltyId: string = uuidv4();

  // var accrualRules: LoyaltyAccrual[] = [];
  if (loyaltyProgram.accrualRules) {
    loyaltyProgram.accrualRules.forEach(function(loyaltyAccrualRule) {
      createAccrual(loyaltyAccrualRule, categoryIdMap, loyaltyProgram.terminology!, loyaltyAccrualRepository, loyaltyId);
    })
  }

  if (loyaltyProgram.rewardTiers) {
    loyaltyProgram.rewardTiers.forEach(function(loyaltyRewardTier) {
      if (loyaltyRewardTier.id && loyaltyProgram.terminology) {
        createRewardTier(loyaltyRewardTier, loyaltyProgram.terminology!, loyaltyRewardTierRepository, loyaltyId);
      }
    })
  }

  // var promotions: Promotion[] = [];
  if (loyaltyPromotions) {
    loyaltyPromotions.forEach(function(loyaltyPromotion) {
      createPromotion(loyaltyPromotion, loyaltyProgram.terminology!, promotionRepository, loyaltyId);
    })
  }
  callback(loyalty);
}

export const isLoyaltyOrPromotionsOutOfDate = (loyalty: Loyalty, loyaltyProgram: LoyaltyProgram, promotions: LoyaltyPromotion[]) => {

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
    console.log("comparing loyaltyProgramUpdatedAt:" + loyaltyProgramUpdatedAt + " to appLoyaltyUpdatedAt: " + appLoyaltyUpdatedAt);
    if (appLoyaltyUpdatedAt.getTime() < loyaltyProgramUpdatedAt.getTime()) {
      return true;
    }
  }

  /// Now check all promotions to see if they're out of date, removed or new promos have been added
  console.log("promotions length: " + promotions.length);
  for (var loyaltyPromotion of promotions) {
    console.log("checking promo " + loyaltyPromotion.id);
    if (loyaltyPromotion.id && loyalty.promotions) {
      var wasPromoFound = false;
      for (var appPromotion of loyalty.promotions) {
        console.log("appPromotion.promotionId: " + appPromotion.promotionId);
        console.log("appPromotion.merchantName: " + appPromotion.merchantName);
        if (appPromotion.promotionId == loyaltyPromotion.id! && appPromotion.lastUpdateDate) {
          wasPromoFound = true;
        // if (appPromotion.promotionId == loyaltyPromotion.id!) {
          if (loyaltyPromotion.updatedAt) {
            var loyaltyUpdatedAt = new Date(loyaltyPromotion.updatedAt);
            if (loyaltyUpdatedAt) {
              console.log("comparing lastUpdateDate:" + appPromotion.lastUpdateDate + " to loyaltyUpdatedAt: " + loyaltyUpdatedAt);
              if (appPromotion.lastUpdateDate!.getTime() < loyaltyUpdatedAt.getTime()) {
                console.log("returning true1");
                return true;
              }
            } else {
              console.log("returning true2");
              return true;
            }
          } else {
            console.log("returning true3");
            return true;
          }
        }
      }
      if (!wasPromoFound) {
        console.log("returning true4");
        return true;
      }
    }
  }
  if (loyalty.promotions) {
    for (var appPromotion of loyalty.promotions) {
      if (appPromotion.loyaltyId) {
        console.log("checking to see if appPromotion exists in loyalty promotions");
        var wasPromoFound = false;
        for (var loyaltyPromotion of promotions) {
          console.log("comparing loyaltyPromotion.promotionId: " + loyaltyPromotion.id + " to appPromotion.promotionId: " + appPromotion.promotionId);
          if (loyaltyPromotion.id && loyaltyPromotion.id == appPromotion.promotionId) {
            wasPromoFound = true;
            console.log("setting wasPromoFound to true");
          }
        }
        if (!wasPromoFound) {
          console.log("returning true5");
          return true;
        }
      }
    }
  }
  return false;
}

export const updateAppLoyaltyFromMerchant = async (loyalty: Loyalty, loyaltyProgram: LoyaltyProgram, promotions: LoyaltyPromotion[], categoryIdMap: Map<string, string>, callback: any) => {
  console.log("inside updateAppLoyaltyFromMerchant");

  const loyaltyAccrualRepository = getManager().getRepository(LoyaltyAccrual);
  const loyaltyRewardTierRepository = getManager().getRepository(LoyaltyRewardTier);
  const promotionRepository = getManager().getRepository(Promotion);
  const loyaltyRepository = getManager().getRepository(Loyalty);

  const queryRunner = await getConnection().createQueryRunner();
  await queryRunner.startTransaction();

  try {
    if (loyaltyProgram.accrualRules && loyaltyProgram.terminology) {
      for (var loyaltyAccrualRule of loyaltyProgram.accrualRules) {
        var existingAppAccural: LoyaltyAccrual | undefined = undefined;
        var displayEarningPointsDescription: string | undefined = undefined;
        var displayAdditionalEarningPointsDescription: string | undefined = undefined;
        if (loyalty.loyaltyAccruals) {
          if (loyaltyAccrualRule.accrualType == "ITEM_VARIATION") {
            if (loyaltyAccrualRule.itemVariationData?.itemVariationId) {
              for (var appLoyaltyAccrual of loyalty.loyaltyAccruals) {
                if (appLoyaltyAccrual.variantId && appLoyaltyAccrual.variantId == loyaltyAccrualRule.itemVariationData!.itemVariationId) {
                  existingAppAccural = appLoyaltyAccrual;
                  displayEarningPointsDescription = appLoyaltyAccrual.displayEarningPointsDescription ?? undefined;
                  displayAdditionalEarningPointsDescription = appLoyaltyAccrual.displayEarningAdditionalEarningPointsDescription ?? undefined;
                }
              }
            }
          } else if (loyaltyAccrualRule.accrualType == "CATEGORY") {
            if (loyaltyAccrualRule.categoryData?.categoryId) {
              for (var appLoyaltyAccrual of loyalty.loyaltyAccruals) {
                if (appLoyaltyAccrual.categoryId && appLoyaltyAccrual.categoryId   == loyaltyAccrualRule.categoryData!.categoryId) {
                  existingAppAccural = appLoyaltyAccrual;
                  displayEarningPointsDescription = appLoyaltyAccrual.displayEarningPointsDescription ?? undefined;
                  displayAdditionalEarningPointsDescription = appLoyaltyAccrual.displayEarningAdditionalEarningPointsDescription ?? undefined;
                }
              }
            }
          } else {
            console.log("checking for matches");
            var matches = loyalty.loyaltyAccruals!.filter((accrual) => accrual.accrualType == loyaltyAccrualRule.accrualType);
            if (matches && matches.length > 0) {
              existingAppAccural = matches[0];
              displayEarningPointsDescription = matches[0].displayEarningPointsDescription ?? undefined;
              displayAdditionalEarningPointsDescription = matches[0].displayEarningAdditionalEarningPointsDescription ?? undefined;
            }
          }
        }
        var categoryName: string | null | undefined = undefined;
        if (loyaltyAccrualRule.categoryData?.categoryId) {
          categoryName = categoryIdMap.get(loyaltyAccrualRule.categoryData!.categoryId);
        }
        const currentRuleDescriptions = rewardsRuleValue(loyaltyAccrualRule, categoryName, loyaltyProgram.terminology!);
        console.log("currentRuleDescriptions: " + currentRuleDescriptions);
        console.log("existingAppAccural: " + existingAppAccural)

        // If core description or core additional description has changed, disregard existing app accrual
        if (existingAppAccural) {
          console.log("existingAppAccural!.merchantEarningPointsDescription: " + existingAppAccural!.merchantEarningPointsDescription);
          console.log("currentRuleDescriptions[0]: " + currentRuleDescriptions[0]);
          if (existingAppAccural!.merchantEarningPointsDescription && existingAppAccural!.merchantEarningPointsDescription != currentRuleDescriptions[0]) {
            console.log("setting existingAppAccural to null1. existingAppAccural?.merchantEarningPointsDescription: " + existingAppAccural?.merchantEarningPointsDescription + ", currentRuleDescriptions[0]: " + currentRuleDescriptions[0]);
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
          updateAccrual(loyaltyAccrualRule, categoryIdMap, loyaltyProgram.terminology!, loyaltyAccrualRepository, loyalty.id, existingAppAccural, displayEarningPointsDescription, displayAdditionalEarningPointsDescription);
        } else {
          createAccrual(loyaltyAccrualRule, categoryIdMap, loyaltyProgram.terminology!, loyaltyAccrualRepository, loyalty.id);
        }
      }
    }

    // Update Reward Tiers
    if (loyaltyProgram.rewardTiers) {
      for (var loyaltyRewardTier of loyaltyProgram.rewardTiers) {
        var existingAppRewardTier: LoyaltyRewardTier | undefined = undefined;
        var displayRewardDescription: string | undefined = undefined;
        if (loyalty.loyaltyRewardTiers && loyaltyRewardTier.id) {
          console.log("searching loyaltyRewardTiers for loyaltyRewardTier.id" + loyaltyRewardTier.id);
          var tierMatches = loyalty.loyaltyRewardTiers!.filter((rewardTier) => rewardTier.rewardTierId == loyaltyRewardTier.id!);
          if (tierMatches && tierMatches.length > 0) {
            existingAppRewardTier = tierMatches[0];
            displayRewardDescription = tierMatches[0].displayRewardDescription ?? undefined;
          }
        }
        console.log("existingAppRewardTier: " + existingAppRewardTier);
        console.log("comparing existingAppRewardTier?.merchantRewardDescription: " + existingAppRewardTier?.merchantRewardDescription + " to loyaltyRewardTier.name: " + loyaltyRewardTier.name)
        if (existingAppRewardTier) {
          if (existingAppRewardTier!.merchantRewardDescription && loyaltyRewardTier.name) {
            if (existingAppRewardTier!.merchantRewardDescription != loyaltyRewardTier.name) {
              console.log("clearing existingAppRewardTier.displayRewardDescription");
              displayRewardDescription = undefined;
            }
          }
        }
        if (existingAppRewardTier) {
          updateRewardTier(loyaltyRewardTier, loyaltyProgram.terminology!, loyaltyRewardTierRepository, loyalty.id, existingAppRewardTier, displayRewardDescription);
        } else {
          createRewardTier(loyaltyRewardTier, loyaltyProgram.terminology!, loyaltyRewardTierRepository, loyalty.id);
        }
      }
    }

    //Update Promotions from merchant
    for (var loyaltyPromotion of promotions) {
      var existingPromotion: Promotion | undefined = undefined;
      var displayName: string | undefined = undefined;
      if (loyalty.promotions && loyaltyPromotion.id) {
        console.log("searching loyalty.promotions for loyaltyPromotion.promotionId" + loyaltyPromotion.id);
        var promoMatches = loyalty.promotions!.filter((promo) => promo.promotionId == loyaltyPromotion.id!);
        if (promoMatches && promoMatches.length > 0) {
          existingPromotion = promoMatches[0];
          displayName = existingPromotion.displayName ?? undefined;
        }
      }
      console.log("existingPromotion: " + existingPromotion);
      if (existingPromotion) {
        // Remove overriden name if the merchant name has changed since we overrode it
        if (existingPromotion!.merchantName && loyaltyPromotion.name != existingPromotion.merchantName) {
          displayName = undefined;
        }
      }
      if (existingPromotion) {
        updatePromotion(loyaltyPromotion, loyaltyProgram.terminology!, promotionRepository, loyalty.id, existingPromotion, displayName);
      } else {
        createPromotion(loyaltyPromotion, loyaltyProgram.terminology!, promotionRepository, loyalty.id);
      }
    }

    //Now let's remove old accrual rows from the db that are no longer in the loyalty program
    if (loyalty.loyaltyAccruals) {
      for (var appLoyaltyAccrual of loyalty.loyaltyAccruals) {
        var wasAccrualFound = false;
        // Look up accrual in currenty loyalty program
        if (loyaltyProgram.accrualRules && loyaltyProgram.terminology) {
          for (var loyaltyAccrualRule of loyaltyProgram.accrualRules) {
            if (loyaltyAccrualRule.accrualType == "ITEM_VARIATION" && appLoyaltyAccrual.accrualType == "ITEM_VARIATION") {
              if (loyaltyAccrualRule.itemVariationData?.itemVariationId == appLoyaltyAccrual.variantId) {
                wasAccrualFound = true;
              }
            } else if (loyaltyAccrualRule.accrualType == "CATEGORY" && appLoyaltyAccrual.accrualType == "CATEGORY") {
              if (loyaltyAccrualRule.categoryData?.categoryId == appLoyaltyAccrual.categoryId) {
                wasAccrualFound = true;
                console.log("got a match on Category accrual");
              }
            } else if (loyaltyAccrualRule.accrualType == "VISIT" && appLoyaltyAccrual.accrualType == "VISIT") {
              wasAccrualFound = true;
            } else if (loyaltyAccrualRule.accrualType == "SPEND" && appLoyaltyAccrual.accrualType == "SPEND") {
              wasAccrualFound = true;
            }
          }
        }
        if (!wasAccrualFound) {
          console.log("need to delete accrualId: " + appLoyaltyAccrual.id);
          deleteAccrual(appLoyaltyAccrual.id, loyaltyAccrualRepository)
        }
      }
    }

    //Remove old reward tier rows
    if (loyalty.loyaltyRewardTiers) {
      for (var appRewardTier of loyalty.loyaltyRewardTiers) {
        var wasRewardTierFound = false;
        if (loyaltyProgram.rewardTiers) {
          for (var loyaltyRewardTier of loyaltyProgram.rewardTiers) {
            if (loyaltyRewardTier.id) {
              if (appRewardTier.rewardTierId == loyaltyRewardTier.id) {
                wasRewardTierFound = true;
                console.log("found rewardTier");
              }
            }
          }
        }
        if (!wasRewardTierFound) {
          console.log("need to delete rewardTier: " + appRewardTier.id);
          deleteRewardTier(appRewardTier.id, loyaltyRewardTierRepository);
        }
      }
    }

    //Remove old promotion rows
    if (loyalty.promotions) {
      for (var appPromotion of loyalty.promotions) {
        var wasPromotionFound = false;
        for (var loyaltyPromotion of promotions) {
          if (loyaltyPromotion.id) {
            if (appPromotion.promotionId == loyaltyPromotion.id) {
              wasPromotionFound = true;
              console.log("found promotion");
            }
          }
        }
        if (!wasPromotionFound) {
          console.log("need to delete promotion: " + appPromotion.id);
          deletePromotion(appPromotion.id, promotionRepository);
        }
      }
    }

    // updateLoyaltyUpdatedDate(loyalty.id, loyaltyRepository);

    await queryRunner.commitTransaction();
    callback(loyalty);
  } catch (err) {
    console.log("error in updateAppLoyaltyFromMerchant: " + err);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
  }
}

export const updateLoyaltyStatus = async (businessId: string, showLoyaltyInApp: boolean, showPromotionsInApp: boolean, automaticallyUpdateChangesFromMerchant: boolean, loyaltyStatus: string, callback: any) => {
  console.log("inside updateLoyaltyStatus");

  console.log("showLoyaltyInApp: " + showLoyaltyInApp);

  const loyaltyRepository = getManager().getRepository(Loyalty);

  const existingLoyalty = await loyaltyRepository
    .createQueryBuilder("loyalty")
    .where('loyalty.businessId = :businessId', { businessId: businessId })
    .getOne()
    // .leftJoinAndSelect("loyalty.business", "business")
    // .getMany()

  if (existingLoyalty) {
    await loyaltyRepository.update(existingLoyalty.id, {
      showLoyaltyInApp: showLoyaltyInApp,
      showPromotionsInApp: showPromotionsInApp,
      automaticallyUpdateChangesFromMerchant: automaticallyUpdateChangesFromMerchant,
      loyaltyStatus: loyaltyStatus,
      lastUpdateDate: new Date(),
    })
    callback(true);
  } else {
    console.log("existingLoyalty not found");
  }
}

const deleteAccrual = async (accrualId: string, loyaltyAccrualRepository: Repository<LoyaltyAccrual>) => {
  await loyaltyAccrualRepository.delete(accrualId);
  console.log("just deleted accral with id:" + accrualId);
}

const deleteRewardTier = async (rewardTierId: string, loyaltyRewardTierRepository: Repository<LoyaltyRewardTier>) => {
  await loyaltyRewardTierRepository.delete(rewardTierId);
  console.log("just deleted reward tier with id:" + rewardTierId);
}

const deletePromotion = async (promotionId: string, promotionRepository: Repository<Promotion>) => {
  await promotionRepository.delete(promotionId);
  console.log("just deleted promotion with id:" + promotionId);
}

const updateLoyaltyUpdatedDate = async (loyaltyId: string, loyaltyRepository: Repository<Loyalty>) => {
  loyaltyRepository.update(loyaltyId, {
    lastUpdateDate: new Date(),
  })
  console.log("just updated loyalty with id:" + loyaltyId);
}

const createAccrual = async (loyaltyAccrualRule: LoyaltyProgramAccrualRule, categoryIdMap: Map<string, string>,
  terminology: LoyaltyProgramTerminology, loyaltyAccrualRepository: Repository<LoyaltyAccrual>, loyaltyId: string) => {
  var categoryName: string | null | undefined = undefined;
  if (loyaltyAccrualRule.categoryData?.categoryId) {
    categoryName = categoryIdMap.get(loyaltyAccrualRule.categoryData!.categoryId);
  }
  const ruleValues = rewardsRuleValue(loyaltyAccrualRule, categoryName, terminology);
  console.log("ruleValues: " + ruleValues);

  const accrual = loyaltyAccrualRepository.create({
    loyaltyId: loyaltyId,
    accrualType: loyaltyAccrualRule.accrualType,
    categoryId: loyaltyAccrualRule.categoryData?.categoryId,
    variantId: loyaltyAccrualRule.itemVariationData?.itemVariationId,
    merchantEarningPointsDescription: ruleValues[0],
    merchantAdditionalEarningPointsDescription: ruleValues[1],
  });
  await loyaltyAccrualRepository.save(accrual);
  console.log("just created accral with id:" + accrual.id);
}

const updateAccrual = async (loyaltyAccrualRule: LoyaltyProgramAccrualRule, categoryIdMap: Map<string, string>,
  terminology: LoyaltyProgramTerminology, loyaltyAccrualRepository: Repository<LoyaltyAccrual>, loyaltyId: string, existingAppAccural: LoyaltyAccrual, displayEarningPointsDescription: string | undefined, displayAdditionalEarningPointsDescription: string | undefined) => {
    console.log("inside updateAccrual");

    var categoryName: string | null | undefined = undefined;
    if (loyaltyAccrualRule.categoryData?.categoryId) {
      categoryName = categoryIdMap.get(loyaltyAccrualRule.categoryData!.categoryId);
    }
    const ruleValues = rewardsRuleValue(loyaltyAccrualRule, categoryName, terminology);
    console.log("ruleValues: " + ruleValues);

    console.log("existingAppAccural.displayEarningAdditionalEarningPointsDescription = " + existingAppAccural.displayEarningAdditionalEarningPointsDescription);

    await loyaltyAccrualRepository.update(existingAppAccural.id, {
      accrualType: loyaltyAccrualRule.accrualType,
      categoryId: loyaltyAccrualRule.categoryData?.categoryId ?? undefined,
      merchantEarningPointsDescription: ruleValues[0],
      merchantAdditionalEarningPointsDescription: ruleValues[1],
      displayEarningPointsDescription: displayEarningPointsDescription ?? null,
      displayEarningAdditionalEarningPointsDescription: displayAdditionalEarningPointsDescription ?? null,
      lastUpdateDate: new Date(),
    })
    console.log("just updated loyatyAccrual with id:" + existingAppAccural.id);
}

const createRewardTier = async (loyaltyRewardTier: LoyaltyProgramRewardTier,
  terminology: LoyaltyProgramTerminology, loyaltyRewardTierRepository: Repository<LoyaltyRewardTier>, loyaltyId: string) => {
    const rewardTier = loyaltyRewardTierRepository.create({
      loyaltyId: loyaltyId,
      rewardTierId: loyaltyRewardTier.id,
      merchantReward: getRewardValue(loyaltyRewardTier, terminology),
      merchantRewardDescription: loyaltyRewardTier.name
    });
    // rewardTiers.push(rewardTier);
    await loyaltyRewardTierRepository.save(rewardTier);
    console.log("just created rewardTier with id:" + rewardTier.id);
}

const updateRewardTier = async (loyaltyRewardTier: LoyaltyProgramRewardTier,
  terminology: LoyaltyProgramTerminology, loyaltyRewardTierRepository: Repository<LoyaltyRewardTier>, loyaltyId: string, existingAppRewardTier: LoyaltyRewardTier, displayRewardDescription: string | undefined) => {
    loyaltyRewardTierRepository.update(existingAppRewardTier.id, {
      merchantReward: getRewardValue(loyaltyRewardTier, terminology),
      merchantRewardDescription: loyaltyRewardTier.name,
      displayReward: existingAppRewardTier.displayReward ?? null,
      displayRewardDescription: displayRewardDescription ?? null,
      lastUpdateDate: new Date(),
    });
    console.log("just updaated rewardTier with id:" + existingAppRewardTier.id);
}

const createPromotion = async (loyaltyPromotion: LoyaltyPromotion,
  terminology: LoyaltyProgramTerminology, promotionRepository: Repository<Promotion>, loyaltyId: string) => {
    var startsOn: Date | undefined;
    if (loyaltyPromotion.availableTime.startDate) {
      startsOn = new Date(loyaltyPromotion.availableTime.startDate!);
    }
    const promotion = promotionRepository.create({
      loyaltyId: loyaltyId,
      promotionId: loyaltyPromotion.id,
      status: loyaltyPromotion.status,
      merchantName: loyaltyPromotion.name,
      promotionStartsOn: startsOn,
    });
    // promotions.push(promotion);
    await promotionRepository.save(promotion);
    console.log("just created promotion with id: " + promotion.id);
}

const updatePromotion = async (loyaltyPromotion: LoyaltyPromotion,
  terminology: LoyaltyProgramTerminology, promotionRepository: Repository<Promotion>, loyaltyId: string, existingPromotion: Promotion, displayName: string | undefined) => {
    var startsOn: Date | undefined;
    if (loyaltyPromotion.availableTime.startDate) {
      startsOn = new Date(loyaltyPromotion.availableTime.startDate!);
    }
    promotionRepository.update(existingPromotion.id, {
      status: loyaltyPromotion.status,
      merchantName: loyaltyPromotion.name,
      promotionStartsOn: startsOn,
      displayName: displayName ?? null,
      lastUpdateDate: new Date(),
    });
    console.log("just updated promotion with id: " + existingPromotion.id);
}

const rewardsRuleValue = (accrualRule: LoyaltyProgramAccrualRule, categoryName: string | null | undefined, terminology: LoyaltyProgramTerminology) => {
  console.log("inside rewardsRuleValue with accrualType of " + accrualRule.accrualType);
  switch(accrualRule.accrualType) {
    case "VISIT":
      console.log("rewardsRuleValue type is VISIT");
      var visitRuleDescription = rewardsPointsEarned(accrualRule.points, terminology) + " for every visit. ";
      if (accrualRule.visitData?.minimumAmountMoney && accrualRule.visitData?.minimumAmountMoney?.amount) {
        const currency = accrualRule.visitData?.minimumAmountMoney.currency ?? "USD"
        const amount = accrualRule.visitData?.minimumAmountMoney?.amount;

        if (amount && currency) {
          const currencyType = getMoneyCurrencyType(currency);
          if (currencyType) {
            const adjustedAmount = Number(amount) / 100.00;
            const showCents = (Number(amount) % 100.00) > 0;
            const ruleMinimum =
              adjustedAmount.toLocaleString(currencyType,
                {style: "currency", currency: currency,
                  maximumFractionDigits: showCents ? 2 : 0}
              );
            visitRuleDescription += ruleMinimum + " minimum purchase.";
          }
        }
      }
      return [visitRuleDescription, ""];

    case "SPEND":
      console.log("rewardsRuleValue type is SPEND");
      var additionalDescription = "";
      const amount = accrualRule.spendData?.amountMoney?.amount;
      const currency = accrualRule.spendData?.amountMoney?.currency ?? "USD"
      if (amount && currency) {
        console.log("got amount and currency");
        const currencyType = getMoneyCurrencyType(currency);
        if (currencyType) {
          const adjustedAmount = Number(amount) / 100.00;
          const showCents = (Number(amount) % 100.00) > 0;
          const ruleAmount = adjustedAmount.toLocaleString(
            currencyType, {style: "currency", currency: currency,
              maximumFractionDigits: showCents ? 2 : 0}
          );
          var spendRuleDescription = rewardsPointsEarned(accrualRule.points, terminology)
          spendRuleDescription += " for every " + ruleAmount +
            " spent in a single transaction.";
          const excludedItemVariationIds =
            accrualRule.spendData?.excludedItemVariationIds;
          const excludedCategoryIds =
            accrualRule.spendData?.excludedCategoryIds;
          if ((excludedItemVariationIds &&
            excludedItemVariationIds.length > 0) ||
            (excludedCategoryIds && excludedCategoryIds.length > 0)) {
            additionalDescription =
              "Certain items are excluded from earning Stars";
          }
          return [spendRuleDescription, additionalDescription];
        }
      } else {
        console.log("missing amount or currency");
      }
      return ["", ""];

    case "CATEGORY":
      console.log("rewardsRuleValue type is CATEGORY");
      const ruleDescription = rewardsPointsEarned(accrualRule.points, terminology);
      const name = categoryName ?? "";
      return [ruleDescription + " for any item in " + name + " purchased", undefined];

    case "ITEM_VARIATION":
      console.log("rewardsRuleValue type is ITEM");
      const itemRuleDescription = rewardsPointsEarned(accrualRule.points, terminology) + " for every purchase of select items.";
      return [itemRuleDescription, ""];
  }
  return [undefined, undefined];
}

const MoneyCurrencyType = {
  USD: "en-US",
};

const getMoneyCurrencyType = (type: any) => {
  if (type == "USD") {
    return MoneyCurrencyType.USD;
  }
  return null;
}

const rewardsPointsEarned = (loyaltyPoints: number | null | undefined, terminology: LoyaltyProgramTerminology) => {
  var ruleDescription = "Earn ";
  const points = loyaltyPoints ?? 0;
  return ruleDescription + String(points) + " " + (points > 1 ? terminology.other : terminology.one);
}

const getRewardValue = (rewardTier: LoyaltyProgramRewardTier, terminology: LoyaltyProgramTerminology) => {
     return String(rewardTier.points) + " " + (rewardTier.points > 1 ? terminology.other : terminology.one);
 }

module.exports = {
  createAppLoyaltyFromLoyaltyProgram,
  isLoyaltyOrPromotionsOutOfDate,
  updateAppLoyaltyFromMerchant,
  updateLoyaltyStatus,
  LoyaltyStatusType,
}
