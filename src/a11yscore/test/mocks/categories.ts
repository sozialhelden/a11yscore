import { osm_amenities } from "~/db/schema/osm-sync";
import { eq, inArray, sql, desc } from "drizzle-orm";

export const activeCategory: categoryConfig.TopLevelCategory = {
  id: "food-and-drinks" as any,
  name: () => "Active Category",
  weight: 1.0,
  sustainableDevelopmentGoals: [],
  interpretation: () => "",
};

export const subCategory: categoryConfig.SubCategory = {
  id: "pubs" as any,
  name: () => "Mock Sub",
  parent: activeCategory.id,
  weight: 1.0,
  osmTags: [{ key: "amenity", value: "pub" }],
  sql: { from: osm_amenities, where: sql`${osm_amenities.amenity} = 'pub'` },
  topics: [
    {
      topicId: "mobility" as any,
      criteria: [
        { criterionId: "is-wheelchair-accessible" as any, weight: 1.0 },
      ],
    },
  ],
};

export const activeCategory2: categoryConfig.TopLevelCategory = {
  id: "health-care" as any,
  name: () => "Active Category",
  weight: 1.0,
  sustainableDevelopmentGoals: [],
  interpretation: () => "",
};

export const subCategory2: categoryConfig.SubCategory = {
  id: "hospitals" as any,
  name: () => "Mock Sub 2",
  parent: activeCategory2.id,
  weight: 1.0,
  osmTags: [{ key: "amenity", value: "hospital" }],
  sql: {
    from: osm_amenities,
    where: sql`${osm_amenities.amenity} = 'hospital'`,
  },
  topics: [
    {
      topicId: "mobility" as any,
      criteria: [
        { criterionId: "is-wheelchair-accessible" as any, weight: 1.0 },
      ],
    },
  ],
};

export const plannedCategory: categoryConfig.TopLevelCategory = {
  id: "education" as any,
  name: () => "Planned Category",
  weight: 0.5,
  sustainableDevelopmentGoals: [],
  interpretation: () => "",
  planned: true,
};
