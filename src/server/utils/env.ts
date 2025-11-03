export function useIsDevelopment() {
  return useRuntimeConfig().env === "development";
}

export function useIsProduction() {
  return useRuntimeConfig().env === "production";
}
