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
