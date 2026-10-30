import { EvidenceStatus } from '../../evidence/models/evidence.model';

export interface ReviewDetailTab {
  id: string;
  label: string;
}

export interface ReviewDetailTabData extends ReviewDetailTab {
  code: string;
  evUploaded: number;
  evRequired: number;
  hasPending: boolean;
  badgeClass: string;
}

export interface EvidenceStatusChangePayload {
  fileId: string;
  status: EvidenceStatus;
}

export type ApprovalStepId = 'pmStatus' | 'reviewerStatus' | 'leadStatus' | 'finalStatus';

