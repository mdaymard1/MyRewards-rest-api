import exp from 'constants';

export class SquareWebhook {
  constructor(payload: any) {
    console.log(
      'inside SquareWebhook constructor with type: ' + payload.data.type,
    );
    this.type = payload.type;
    this.merchantId = payload.merchant_id;
    if (
      (this.type == 'loyalty.program.updated' ||
        this.type == 'loyalty.program.created') &&
      this.merchantId &&
      payload.data.type == 'loyalty.program' &&
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
      payload.data.type == 'loyalty.promotion' &&
      payload.data.object.loyalty_promotion
    ) {
      this.loyaltyPromotion = new SquareLoyaltyPromotion(
        payload.data.object.loyalty_promotion,
      );
    }
    if (
      this.type == 'catalog.version.updated' &&
      this.merchantId &&
      payload.data.type == 'catalog' &&
      payload.data.object.catalog_version
    ) {
      this.catalogVersionUpdated = new SquareCatalogVersionUpdated(
        payload.data.object.catalog_version,
      );
    }
    console.log('SquareWebhook initialized');
  }
  merchantId: string;
  type: string;
  loyaltyProgram: SquareLoyaltyProgram;
  loyaltyPromotion: SquareLoyaltyPromotion;
  catalogVersionUpdated: SquareCatalogVersionUpdated;
}

export class SquareCatalogVersionUpdated {
  constructor(payload: any) {
    console.log('inside SquareCatalogVersionUpdated constructor');
    if (payload.updated_at) {
      this.catalogVersion = {
        updatedAt: payload.updated_at,
      };
    }
  }
  catalogVersion: {
    updatedAt: string;
  };
}

export class SquareLoyaltyPromotion {
  constructor(payload: any) {
    console.log('inside SquareLoyaltyPromotion constructor');
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
    console.log('inside SquareLoyaltyProgram constructor');
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
    console.log('inside SquareAccrualRules constructor');
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
        itemVariationId: payload.item_variation_data.item_variation_id,
      };
    } else if (payload.category_data) {
      this.categoryData = {
        categoryId: payload.category_data.category_id,
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
    console.log('inside SquareRewardTier constructor');
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
