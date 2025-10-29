export function byName(a: { name: () => string }, b: { name: () => string }) {
  return a.name().localeCompare(b.name());
}
