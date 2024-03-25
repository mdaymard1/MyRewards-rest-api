export class RewardDetails {
  type: string;
  rewardDescription: string;
  remainingPoints: number | undefined;
  constructor(
    type: string,
    rewardDescription: string,
    remainingPoints?: number
  ) {
    this.type = type;
    this.rewardDescription = rewardDescription;
    this.remainingPoints = remainingPoints;
  }
}
