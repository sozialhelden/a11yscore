/**
 * Adds an `id` property to each entry in a configuration object that uses
 * it's key as the `id`.
 *
 * Reason: We rather define configuration objects with ids as keys to quickly
 * access stuff by a given id. But when using the data later, we need access
 * to the id and having it only in the parent object as key is not sufficient,
 * so this utility function adds the `id` property from the key to each entry.
 *
 * @example
 * ```
 * const config = {
 *  entry1: { name: "Entry 1" },
 *  entry2: { name: "Entry 2" },
 * };
 * console.log(addIdToConfigEntries(config));
 * // output:
 * // {
 * //   entry1: { id: "entry1", name: "Entry 1" },
 * //   entry2: { id: "entry2", name: "Entry 2" },
 * // }
 * ```
 */
export function addIdToConfigEntries<
  Id extends string | number | symbol,
  Properties extends {},
>(
  config: Record<Id, Omit<Properties, "id">>,
): Record<Id, Properties & { id: Id }> {
  return Object.entries(config).reduce(
    (acc, [id, properties]) => {
      acc[id as Id] = {
        id: id as Id,
        ...(properties as Properties),
      };
      return acc;
    },
    {} as Record<Id, Properties & { id: Id }>,
  );
}
