export interface BusinessRoleMappingModel {
  businessRoleMappingId: string;

  userId: string;
  userName: string;

  businessRoleId: string;
  businessRoleName: string;
  roleCode: string;

  regionId: string | null;
  regionCode: string | null;
  regionName: string | null;

  reviewStageCode: string | null;
  reviewStageName: string | null;

  categoryId: string | null;
  categoryCode: string | null;
  categoryName: string | null;
  categoryColor: string | null;

  isActive: boolean;
}
export interface SaveBusinessRoleMappingRequest {
  businessRoleMappingId: string | null;

  userId: string;
  businessRoleId: string;

  reviewStageCode: string | null;

  categoryCode: string | null;

  isActive: boolean;
}

export interface SaveBusinessRoleMappingResponse {
  businessRoleMappingId: string;
}

export interface DeleteBusinessRoleMappingResponseDto {
  isDeleted: boolean;
}

export interface BusinessRoleMappingDetailModel {
  businessRoleMappingId: string;

  userId: string;
  userName: string;

  businessRoleId: string;
  businessRoleName: string;
  roleCode: string;

  regionId: string | null;
  regionCode: string | null;
  regionName: string | null;

  reviewStageCode: string | null;
  reviewStageName: string | null;

  categoryCode: string | null;
  categoryName: string | null;
  categoryColor: string | null;

  isActive: boolean;
}