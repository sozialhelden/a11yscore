export type TopicProperties = {
	label: () => string;
};

export type Topic = "mobility" | "visual";

export const topics: Record<Topic, TopicProperties> = {
	mobility: {
		label: () => "Mobility",
	},
	visual: {
		label: () => "Visual",
	},
};
