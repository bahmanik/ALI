type GenericResourceMetrics = {
  total: number;
  used: number;
  percentage: number;
};

export type GenericResourceData = GenericResourceMetrics & {
  free: number;
};

export interface DriveStorageData extends GenericResourceData {
  path: string;
  name: string;
}

export interface MultiDriveStorageData {
  total: GenericResourceData;
  drives: DriveStorageData[];
}
