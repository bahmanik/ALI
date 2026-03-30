import GLib from "gi://GLib?version=2.0";
import { CpuTempSensorDiscovery } from "./sensorDiscovery";

export class CpuTempObserver {
  private _resolvedSensorPath?: string;

  constructor() {

    this._resolveSensorPath();
  }
  private _resolveSensorPath(): void {
    // TODO: you can later change auto to get a specisific cpu temp
    const sensorValue = 'auto';

    if (sensorValue === 'auto' || sensorValue === '') {
      this._resolvedSensorPath = CpuTempSensorDiscovery.discover();
      if (!this._resolvedSensorPath) console.error('No CPU temperature sensor found');
      return;
    }

    if (CpuTempSensorDiscovery.isValid(sensorValue)) {
      this._resolvedSensorPath = sensorValue;
      return;
    }

    console.error(`Invalid sensor: ${sensorValue}, falling back to auto-discovery`);
    this._resolvedSensorPath = CpuTempSensorDiscovery.discover();
  }

  /**
   * Reads CPU temperature from the sensor file and returns it in Celsius
   */
  public getCpuTemp(): number {
    if (!this._resolvedSensorPath) return 0;
    console.log(this._resolvedSensorPath)

    try {
      const [success, tempBytes] = GLib.file_get_contents(this._resolvedSensorPath);
      if (!success || !tempBytes) return 0;

      const tempInfo = new TextDecoder('utf-8').decode(tempBytes);
      const tempValueMillidegrees = parseInt(tempInfo.trim(), 10);
      return tempValueMillidegrees / 1000;
    } catch (error) {
      console.error('Error reading CPU temperature:', error);
      return 0;
    }
  }
}
