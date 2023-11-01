export class SquareWebhook {
  constructor(payload: any) {
    this.type = payload.type;
    this.merchantId = payload.merchant_id;
    if (
      (this.type == 'loyalty.program.updated' ||
        this.type == 'loyalty.program.created') &&
      this.merchantId &&
      payload.data.type == 'loyalty_program' &&
      payload.data.object.loyalty_program
    ) {
      this.loyaltyProgram = new SquareLoyaltyProgram(
        payload.data.object.loyalty_program,
      );
    }
    if (
      (this.type == 'loyalty.promotion.created' ||
        this.type == 'loyalty.promotion.updated') &&
      this.merchantId &&
      payload.data.type == 'loyalty_promotion' &&
      payload.data.object.loyalty_promotion
    ) {
      this.loyaltyPromotion = new SquareLoyaltyPromotion(
        payload.data.object.loyalty_promotion,
      );
    }
    console.log('SquareWebhook initialized');
  }
  merchantId: string;
  type: string;
  loyaltyProgram: SquareLoyaltyProgram;
  loyaltyPromotion: SquareLoyaltyPromotion;
}

export class SquareLoyaltyPromotion {
  constructor(payload: any) {
    this.id = payload.id;
    this.name = payload.name;
    this.status = payload.status;
    this.loyaltyProgramId = payload.loyalty_program_id;
    if (payload.available_time) {
      this.availableTime = {
        startDate: payload.available_time.start_date,
        endDate: payload.available_time.end_date,
      };
    }
  }
  id: string;
  name: string;
  status: string;
  availableTime: {
    startDate: string;
    endDate: string;
  };
  loyaltyProgramId: string;
}

export type SquareTerminology = {
  one: string | undefined;
  other: string | undefined;
};

export class SquareLoyaltyProgram {
  constructor(payload: any) {
    this.id = payload.id;
    this.status = payload.status;
    if (payload.accrual_rules) {
      this.accrualRules = [];
      console.log('creating accrual rules');
      for (var accrual of payload.accrual_rules) {
        this.accrualRules?.push(new SquareAccrualRules(accrual));
      }
    }
    if (payload.reward_tiers) {
      console.log('creating reward tiers');
      this.rewardTiers = [];
      for (var rewardTier of payload.reward_tiers) {
        this.rewardTiers?.push(new SquareRewardTier(rewardTier));
      }
    }
    this.locationIds = [];
    if (payload.location_ids) {
      for (var locationId of payload.location_ids) {
        this.locationIds.push(locationId);
      }
    }
    if (payload.terminology) {
      this.terminology = {
        one: payload.terminology.one,
        other: payload.terminology.other,
      };
    }
  }
  id: string;
  locationIds: string[];
  status: string;
  terminology: SquareTerminology | undefined;
  accrualRules: SquareAccrualRules[] | undefined;
  rewardTiers: SquareRewardTier[] | undefined;
}

export class SquareAccrualRules {
  constructor(payload: any) {
    this.accrualType = payload.accrual_type;
    this.points = payload.points;
    if (payload.spend_data && payload.spend_data?.amount_money) {
      this.spendData = {
        amountMoney: {
          amount: payload.spend_data?.amount_money?.amount,
          currency: payload.spend_data?.amount_money?.currency,
        },
        excludedItemVariationIds:
          payload.spend_data.excluded_item_variation_ids,
        excludedCategoryIds: payload.spend_data.excluded_category_ids,
      };
    } else if (payload.visit_data && payload.visit_data?.amount_money) {
      this.visitData = {
        minimumAmountMoney: {
          amount: payload.visit_data?.amount_money?.amount,
          currency: payload.visit_data?.amount_money?.currency,
        },
      };
    } else if (payload.item_variation_data) {
      this.itemVariationData = {
        itemVariationId: payload.item_variation_data,
      };
    } else if (payload.category_id) {
      this.categoryData = {
        categoryId: payload.category_id,
      };
    }
  }
  accrualType: string;
  points: number;
  spendData: {
    amountMoney: {
      amount: number;
      currency: string;
    };
    excludedItemVariationIds: string[];
    excludedCategoryIds: string[];
  };
  visitData: {
    minimumAmountMoney: {
      amount: number;
      currency: string;
    };
  };
  itemVariationData: {
    itemVariationId: string;
  };
  categoryData: {
    categoryId: string;
  };
}

export class SquareRewardTier {
  constructor(payload: any) {
    this.id = payload.id;
    this.name = payload.name;
    this.points = payload.points;
    if (payload.definition) {
      this.discountType = payload.definition.discount_type;
      this.percentageDiscount = payload.definition.percentage_discount;
      this.scope = payload.definition.scope;
    }
  }
  id: string;
  name: string;
  points: number;
  discountType: string;
  percentageDiscount: string;
  scope: string;
}
