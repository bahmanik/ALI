import GLib from "gi://GLib?version=2.0";

export type GenericResourceData = GenericResourceMetrics & {
  free: number;
};

type GenericResourceMetrics = {
  total: number;
  used: number;
  percentage: number;
};

export class RamObserver {
  public getRamUsage(): GenericResourceData {
    try {
      const [success, meminfoBytes] = GLib.file_get_contents('/proc/meminfo');

      if (!success || meminfoBytes === undefined) {
        throw new Error('Failed to read /proc/meminfo or file content is null.');
      }

      const meminfo = new TextDecoder('utf-8').decode(meminfoBytes);

      const totalMatch = meminfo.match(/MemTotal:\s+(\d+)/);
      const availableMatch = meminfo.match(/MemAvailable:\s+(\d+)/);

      if (!totalMatch || !availableMatch) {
        throw new Error('Failed to parse /proc/meminfo for memory values.');
      }

      const totalRamInBytes = parseInt(totalMatch[1], 10) * 1024;
      const availableRamInBytes = parseInt(availableMatch[1], 10) * 1024;

      let usedRam = totalRamInBytes - availableRamInBytes;
      usedRam = isNaN(usedRam) || usedRam < 0 ? 0 : usedRam;

      return {
        percentage: this._divide([totalRamInBytes, usedRam]),
        total: totalRamInBytes,
        used: usedRam,
        free: availableRamInBytes,
      };
    } catch (error) {
      console.error('Error calculating RAM usage:', error);
      return { total: 0, used: 0, percentage: 0, free: 0 };
    }
  }

  private _divide([total, used]: number[]): number {
    const percentageTotal = (used / total) * 100;

    return total > 0 ? parseFloat(percentageTotal.toFixed(2)) : 0;
  }
}
