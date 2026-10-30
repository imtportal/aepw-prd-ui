export interface Region {
  regionId:     number;
  regionCode:   string;
  regionName:   string;
  createdBy:    number;
  createdOnUtc: string;
  updatedBy:    number | null;
  updatedOnUtc: string | null;
  rowVersion:   string;
}

export interface Country {
  countryId:    number;
  countryCode:  string;
  countryName:  string;
  regionId:     number;
  createdBy:    number;
  createdOnUtc: string;
  updatedBy:    number | null;
  updatedOnUtc: string | null;
  rowVersion:   string;
}
