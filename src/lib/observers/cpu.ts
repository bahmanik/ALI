import GTop from "gi://GTop?version=2.0";

export class CpuObserver {
  private _previousCpuData = new GTop.glibtop_cpu();

  public getCpuUsage(): number {
    const currentCpuData = new GTop.glibtop_cpu();
    GTop.glibtop_get_cpu(currentCpuData);

    const totalDiff = currentCpuData.total - this._previousCpuData.total;
    const idleDiff = currentCpuData.idle - this._previousCpuData.idle;

    const cpuUsagePercentage = totalDiff > 0 ? ((totalDiff - idleDiff) / totalDiff) * 100 : 0;

    this._previousCpuData = currentCpuData;

    return cpuUsagePercentage;
  }
}
