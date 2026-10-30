export interface ProgramModel {
  programId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface ProgramDetailModel {
  programId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdBy: string;
  createdOnUTC: string;
  updatedBy: string | null;
  updatedOnUTC: string | null;
}
export interface GetProgramsRequest {
  pageNumber: string;
  pageSize: string;
  searchText?: string;
  programId?: string | null;
  isActive?: boolean | null;
}

export interface InsertProgramRequest {
  code: string;
  name: string;
  description: string | null;
  createdBy: string;
  isActive: boolean;
}

export interface UpdateProgramRequest {
  programId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  updatedBy: string;
}
