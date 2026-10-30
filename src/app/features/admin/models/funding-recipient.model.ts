export type FundingRecipientStatus = 'Active' | 'Paused' | 'Closed';

export interface FundingRecipient {
  fundingRecipientId: number;
  name:               string;
  orgName:            string;
  countryId:          number;
  status:             FundingRecipientStatus;
  contactName:        string | null;
  contactEmail:       string | null;
  contactPhone:       string | null;
  createdBy:          number;
  createdOnUtc:       string;
  updatedBy:          number | null;
  updatedOnUtc:       string | null;
  rowVersion:         string;
}
