export const allowedCountries = [
  -51477, // Germany
];

export const allowedAdminLevels = [
  4, // = bundesland
  5, // = regierungsbezirk
  6, // = landkreis/kreisfreie stadt
];

export const excludedAdminAreas = [
  // Country of Bremen, includes Bremerhaven.
  // We exclude this to avoid duplicate with Bremen City and Bremerhaven City
  -62718,
];
