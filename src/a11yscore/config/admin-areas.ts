export const allowedCountries = [
  -51477, // Germany
  -365331,
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

export const includedItalianCities = [
  // We temporarily include Rom, Venedig, Florenz, Mailand, Neapel for an event in the Italian consulate
  -41485, // Rome
  -44741, // Venice
  -42602, // Florence
  -44915, // Milan
  -40767, // Naples
];
