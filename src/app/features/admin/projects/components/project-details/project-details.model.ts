
interface ImpactMasterFundingRecipientDto {
    fundingRecipientId: string;
    fundingRecipientName: string;
    fundingRecipientOrgName: string;
}

interface ImpactMasterCityDto {
    impactMasterCityId: string;
    countryName: string;
    cityId: string;
    cityName: string;
}

export interface ImpactMasterDetailDto {
    impactMasterId: string;
    pin: string;
    title: string;
    description: string;
    reportingFrequency: string;
    programId: string;
    programName: string;
    fundingRecipients: ImpactMasterFundingRecipientDto[];
    l1UserId: string;
    l1UserName: string;
    l2ApproverUserId: string;
    l2ApproverUserName: string;
    l3ApproverUserId: string;
    l3ApproverUserName: string;
    corporateApproverUserId: string;
    corporateApproverUserName: string;
    recordTypeId: string;
    recordTypeName: string;
    startDate: string;
    endDate: string;
    actualCompletionDate: string;
    totalFunding: number;
    statusId: string;
    statusCode: string;
    statusName: string;
    createdBy: string;
    createdOnUTC: string;
    updatedBy: string;
    cities: ImpactMasterCityDto[];
    categoryName: string;
    dataCollectionFolderUrl?: string;
    lastFieldCheckDate?: string;
    fieldCheckReport?: string;
}