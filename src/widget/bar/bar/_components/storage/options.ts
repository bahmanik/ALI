export type SizeUnit = 'bytes' | 'kibibytes' | 'mebibytes' | 'gibibytes' | 'tebibytes';
export type StorageUnit = SizeUnit | 'auto';
export type ResourceLabelType = 'used/total' | 'used' | 'percentage' | 'free';
export type TooltipStyle = 'percentage-bar' | 'tree' | 'simple';

type storageOptions = {
  paths: Array<string>,
  label: boolean,
  icon: string,
  round: boolean,
  units: StorageUnit,
  labelType: ResourceLabelType,
  tooltipStyle: TooltipStyle,
  pollingInterval: number,
}

export const storageOptions: storageOptions = {
  paths: ['/'],
  label: true,
  icon: '󰋊',
  round: false,
  units: 'gibibytes',
  labelType: 'used/total',
  tooltipStyle: 'percentage-bar',
  pollingInterval: 2000,
};
