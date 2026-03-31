import GTop from 'gi://GTop';
import { MultiDriveStorageData, DriveStorageData } from './types';
import { GenericResourceData } from '../ram';
import { unique } from 'src/lib/array';

/**
 * Monitors storage usage across multiple drives and provides real-time updates
 *
 * This service polls filesystem usage data for configured mount points and maintains
 * both individual drive statistics and aggregated totals. The data updates automatically
 * at the configured interval and supports dynamic path configuration.
 */
class StorageService {
  private _shouldRound: boolean;
  private _pathsToMonitor: string[];

  /**
   * Creates a new storage monitoring service
   * @param round - Optional rounding preference variable
   * @param pathsToMonitor - Optional array of mount paths to monitor
   */
  constructor({ pathsToMonitor, shouldRound }: { pathsToMonitor?: Array<string>, shouldRound?: boolean }) {
    this._shouldRound = typeof shouldRound === 'undefined' ? false : shouldRound
    this._pathsToMonitor = pathsToMonitor ? unique(pathsToMonitor) : ['/'];

    // console.log("_collectDriveData: ", this._collectDriveData(this._pathsToMonitor))
    // console.log("_getDriveUsage: ", this._getDriveUsage('/'))
    // console.log("_extractDriveName: ", this._extractDriveName('/home/ali/Downloads'))
    // console.log("_calculateTotalUsage: ", this._calculateTotalUsage(this._collectDriveData(this._pathsToMonitor)))
    // console.log("_calculatePercentage: ", this._calculatePercentage)
    // console.log("_getEmptyStorageData: ", this._getEmptyStorageData)
  }

  /**
   * Calculates storage usage for multiple drives and returns both individual and total data
   */
  public calculateMultiDriveUsage(): MultiDriveStorageData {
    try {
      const paths = this._pathsToMonitor;
      const drives = this._collectDriveData(paths);
      const total = this._calculateTotalUsage(drives);

      return { total, drives };
    } catch (error) {
      console.error('Error calculating multi-drive storage usage:', error);
      return this._getEmptyMultyStorageData();
    }
  }

  /**
   * Collects storage data for each monitored drive
   * @param paths - Array of mount paths to monitor
   */
  private _collectDriveData(paths: string[]): DriveStorageData[] {
    return paths
      .map((path) => this._getDriveUsage(path))
      .filter((drive): drive is DriveStorageData => drive !== null);
  }

  /**
   * Gets storage usage for a single drive
   * @param path - The mount path of the drive
   */
  private _getDriveUsage(path: string): DriveStorageData {
    try {
      const fsUsage = new GTop.glibtop_fsusage();
      GTop.glibtop_get_fsusage(fsUsage, path);

      const total = fsUsage.blocks * fsUsage.block_size;
      const available = fsUsage.bavail * fsUsage.block_size;
      const used = total - available;

      if (total === 0) throw "storage: the total should not be 0";

      return {
        path,
        name: this._extractDriveName(path),
        total,
        used,
        free: available,
        percentage: this._calculatePercentage(total, used),
      };
    } catch (error) {
      console.error(`Error getting storage info for ${path}:`, error);
      return this._getEmptyStorageData(path)
    }
  }

  public getDriveUsage(path: string) {
    return this._getDriveUsage(path)
  }

  /**
   * Extracts a readable name from a mount path
   * @param path - The mount path
   */
  private _extractDriveName(path: string): string {
    return path.split('/').filter(Boolean).pop() || path;
  }

  /**
   * Calculates total usage across all drives
   * @param drives - Array of drive data
   */
  private _calculateTotalUsage(drives: DriveStorageData[]): GenericResourceData {
    const totals = drives.reduce(
      (acc, drive) => ({
        total: acc.total + drive.total,
        used: acc.used + drive.used,
        free: acc.free + drive.free,
      }),
      { total: 0, used: 0, free: 0 },
    );

    return {
      ...totals,
      percentage: this._calculatePercentage(totals.total, totals.used),
    };
  }

  /**
   * Calculates percentage with rounding support
   * @param total - Total amount
   * @param used - Used amount
   */
  private _calculatePercentage(total: number, used: number): number {
    if (total === 0) return 0;

    const percentage = (used / total) * 100;
    const shouldRound = this._shouldRound;

    return shouldRound ? Math.round(percentage) : parseFloat(percentage.toFixed(2));
  }

  /**
   * Returns empty MultiDriveStorageData
   */
  private _getEmptyMultyStorageData(): MultiDriveStorageData {
    return {
      total: { total: 0, used: 0, percentage: 0, free: 0 },
      drives: [],
    };
  }

  /**
  * Returns empty DriveStorageData
  */
  private _getEmptyStorageData(path: string): DriveStorageData {
    return {
      path,
      name: this._extractDriveName(path),
      total: 0,
      used: 0,
      free: 0,
      percentage: 0,
    };
  }
}

export default StorageService;
