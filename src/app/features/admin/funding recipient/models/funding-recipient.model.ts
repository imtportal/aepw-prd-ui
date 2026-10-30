export interface CreateFundingRecipientRequest {
  name: string;
  orgName: string;
  contactName?: string;
  email: string;
  phone?: string;
  address: string;
  zipCode: string;
  cityIds: number[];
  isActive: boolean;
  createdBy: number;
}

export interface UpdateFundingRecipientRequest {
  fundingRecipientId: number;
  name: string;
  orgName: string;
  contactName?: string;
  email: string;
  phone?: string;
  address: string;
  zipCode: string;
  cityIds: number[];
  isActive: boolean;
  updatedBy: number;
}

export interface GetFundingRecipientsRequest {
  pageNumber: number;
  pageSize: number;
  searchText?: string | null;
  fundingRecipientId?: number | null;
  cityId?: number | null;
  isActive?: boolean | null;
}

export interface FundingRecipient {
  fundingRecipientId: number;
  name: string;
  orgName: string;
  address: string;
  zipCode: string;

  cityName: string;
  countryName: string;

  contactId?: number | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;

  isActive: boolean;
}

export interface FundingRecipientDetailCityModel {
  fundingRecipientCityId: number;
  cityId: number;
  cityName: string;
  countryName: string;
}

export interface FundingRecipientDetailModel {
  fundingRecipientId: number;
  name: string;
  orgName: string;
  address: string;
  zipCode: string;

  cities: FundingRecipientDetailCityModel[];

  contactId?: number | null;
  contactName?: string | null;
  email: string;
  phone?: string | null;

  isActive: boolean;

  createdBy: number;
  createdOnUTC: string;
  updatedBy?: number;
  updatedOnUTC?: string;
}
