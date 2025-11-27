import { noDataThreshold } from "~~/src/a11yscore/config/data-quality";

export function dataIsUnavailable(dataQualityFactor: number): boolean {
  return dataQualityFactor <= noDataThreshold;
}

export function roundDataQualityFactor(dataQualityFactor: number): number {
  return Math.round(dataQualityFactor * 1000) / 1000;
}
