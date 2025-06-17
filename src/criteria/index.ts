export type CriteriaProperties = {
	label: () => string;
	// TODO: add selectors
};

export type Criteria = "wheelchair-accessible" | "has-digital-menu";

export const criteria: Record<Criteria, CriteriaProperties> = {
	"wheelchair-accessible": {
		label: () => "Wheelchair Accessible",
	},
	"has-digital-menu": {
		label: () => "Has a digital Menu",
	},
};
