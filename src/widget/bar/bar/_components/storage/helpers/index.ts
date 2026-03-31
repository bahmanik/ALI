import { GenericResourceData } from "src/lib/observers/ram";
import { ResourceLabelType, SizeUnit } from "../options";
import { SizeConverter } from "src/lib/units/size";

/**
 * Renders a resource label based on the label type and resource data.
 *
 * This function generates a resource label string based on the provided label type, resource data, and rounding option.
 * It formats the used, total, and free resource values and calculates the percentage if needed.
 *
 * @param lblType The type of label to render (used/total, used, free, or percentage).
 * @param resourceUsage An object containing the resource usage data (used, total, percentage, and free).
 * @param round A boolean indicating whether to round the values.
 *
 * @returns The rendered resource label as a string.
 */
export const renderResourceLabel = (
  lblType: ResourceLabelType,
  resourceUsage: GenericResourceData,
  round: boolean,
  unitType?: SizeUnit,
): string => {
  const { used, total, percentage, free } = resourceUsage;
  const precision = round ? 0 : 2;

  if (lblType === 'used/total') {
    const totalConverter = SizeConverter.fromBytes(total);
    const usedConverter = SizeConverter.fromBytes(used);
    const { unit } = totalConverter.toAuto();
    const sizeUnit: SizeUnit = unitType ?? unit;

    let usedValue: number;
    let totalValue: string;

    switch (sizeUnit) {
      case 'tebibytes':
        usedValue = usedConverter.toTiB(precision);
        totalValue = totalConverter.formatTiB(precision);
        return `${usedValue}/${totalValue}`;
      case 'gibibytes':
        usedValue = usedConverter.toGiB(precision);
        totalValue = totalConverter.formatGiB(precision);
        return `${usedValue}/${totalValue}`;
      case 'mebibytes':
        usedValue = usedConverter.toMiB(precision);
        totalValue = totalConverter.formatMiB(precision);
        return `${usedValue}/${totalValue}`;
      case 'kibibytes':
        usedValue = usedConverter.toKiB(precision);
        totalValue = totalConverter.formatKiB(precision);
        return `${usedValue}/${totalValue}`;
      default:
        usedValue = usedConverter.toBytes(precision);
        totalValue = totalConverter.formatBytes(precision);
        return `${usedValue}/${totalValue}`;
    }
  }

  if (lblType === 'used') {
    return SizeConverter.fromBytes(used).formatAuto(precision);
  }

  if (lblType === 'free') {
    return SizeConverter.fromBytes(free).formatAuto(precision);
  }

  return `${percentage}%`;
};
