import { sql } from "drizzle-orm";
import { osm_amenities } from "~/db/schema/osm-sync";
import type { Translate } from "~/utils/i18n";
import type {
  SubCategory,
  TopLevelCategory,
} from "~~/src/a11yscore/config/categories/index";

/*
 * top-level category
 */

export type EducationTopLevelCategoryId = "education";
export const getEducationTopLevelCategory = ({
  t,
  weight,
}: {
  t: Translate;
  weight: number;
}): Record<EducationTopLevelCategoryId, Omit<TopLevelCategory, "id">> => ({
  education: {
    name: t("Education"),
    sustainableDevelopmentGoals: [4, 5, 8, 9, 10, 11, 17],
    weight,
    interpretation: (score) => {
      if (score >= 75)
        return t("Most of the education facilities are accessible.");
      if (score >= 50)
        return t("Many of the education facilities are accessible.");
      if (score >= 30)
        return t("Some of the education facilities are accessible.");
      if (score > 0)
        return t("Only a few of the education facilities are accessible.");

      return t("The score could not be determined due to missing data.");
    },
    description: t(
      "This category will evaluate the accessibility of educational facilities, including schools, universities, and libraries.",
    ),
    planned: false,
  },
});

const genericEducationTopics: SubCategory["topics"] = [
  {
    topicId: "mobility",
    criteria: [
      {
        criterionId: "is-wheelchair-accessible",
        weight: 0.5,
      },
      {
        criterionId: "has-wheelchair-accessible-toilet",
        weight: 0.5,
      },
    ],
  },
  {
    topicId: "vision",
    criteria: [
      {
        criterionId: "is-accessible-to-visually-impaired",
        weight: 1,
      },
    ],
  },
  {
    topicId: "hearing",
    criteria: [
      {
        criterionId: "is-accessible-to-hearing-impaired",
        weight: 1,
      },
    ],
  },
  {
    topicId: "general-assistance",
    criteria: [
      {
        criterionId: "has-website",
        weight: 1,
      },
    ],
  },
  {
    topicId: "air-and-climate",
    criteria: [
      {
        criterionId: "has-air-conditioning",
        weight: 1,
      },
    ],
  },
];

export type EducationSubCategoryId =
  | "kindergartens"
  | "schools"
  | "higher-education"
  | "other-education"
  | "driving-schools";

const weight = 1 / 5;
// college = adult_education marks "Volkshochschulen" in Germany, which are a specific type of education facilities
// that don't fit well in the other categories, so we put them in "other education" and exclude them from "schools" and "higher education"
export const getEducationSubCategories = (
  t: Translate,
): Record<EducationSubCategoryId, Omit<SubCategory, "id">> => ({
  kindergartens: {
    name: t("Kindergartens"),
    parent: "education",
    weight: weight,
    osmTags: [
      { key: "education", value: "kindergarten" },
      { key: "amenity", value: "kindergarten" },
      { key: "amenity", value: "childcare" },
    ],
    description: t(
      "Includes kindergartens, childcare facilities and preschools. These are educational facilities for young children, typically between the ages of 3 and 6.",
    ),
    sql: {
      from: osm_amenities,
      where: sql`(${sql.join(
        [
          sql`${osm_amenities.tags}->'education' = 'kindergarten'`,
          sql`${osm_amenities.amenity} = 'kindergarten'`,
          sql`${osm_amenities.amenity} = 'childcare'`,
        ],
        sql` OR `,
      )})`,
    },
    topics: genericEducationTopics,
  },
  schools: {
    name: t("Schools"),
    parent: "education",
    weight: weight,
    osmTags: [
      { key: "amenity", value: "school" },
      { key: "education", value: "school" },
    ],
    description: t(
      "Includes primary and secondary schools, which provide education for children and teenagers typically between the ages of 6 and 18.",
    ),
    sql: {
      from: osm_amenities,
      where: sql`(${sql.join(
        [
          sql`${osm_amenities.amenity} = 'school'`,
          sql`${osm_amenities.tags}->'education' = 'school'`,
        ],
        sql` OR `,
      )})
      AND (${osm_amenities.tags}->'college' IS NULL OR ${osm_amenities.tags}->'college' != 'adult_education')`,
    },
    topics: genericEducationTopics,
  },
  "higher-education": {
    name: t("Higher Education"),
    parent: "education",
    weight: weight,
    osmTags: [
      { key: "amenity", value: "university" },
      { key: "amenity", value: "college" },
      { key: "education", value: "university" },
      { key: "education", value: "college" },
      { key: "police", value: "academy" },
    ],
    description: t(
      "Includes universities, colleges and other higher education institutions like police academies that provide education and research opportunities for students typically aged 18 and above.",
    ),
    sql: {
      from: osm_amenities,
      where: sql`(${sql.join(
        [
          sql`${osm_amenities.amenity} = 'university'`,
          sql`${osm_amenities.amenity} = 'college'`,
          sql`${osm_amenities.tags}->'education' = 'university'`,
          sql`${osm_amenities.tags}->'education' = 'college'`,
          sql`${osm_amenities.tags}->'police' = 'academy'`,
        ],
        sql` OR `,
      )})
      AND (${osm_amenities.tags}->'college' IS NULL OR ${osm_amenities.tags}->'college' != 'adult_education')`,
    },
    topics: [
      {
        topicId: "mobility",
        criteria: [
          {
            criterionId: "is-wheelchair-accessible",
            weight: 0.5,
          },
          {
            criterionId: "has-wheelchair-accessible-toilet",
            weight: 0.5,
          },
        ],
      },
      {
        topicId: "vision",
        criteria: [
          {
            criterionId: "is-accessible-to-visually-impaired",
            weight: 1,
          },
        ],
      },
      {
        topicId: "hearing",
        criteria: [
          {
            criterionId: "is-accessible-to-hearing-impaired",
            weight: 0.5,
          },
          {
            criterionId: "has-hearing-loop",
            weight: 0.5,
          },
        ],
      },
      {
        topicId: "general-assistance",
        criteria: [
          {
            criterionId: "has-website",
            weight: 1,
          },
        ],
      },
      {
        topicId: "air-and-climate",
        criteria: [
          {
            criterionId: "has-air-conditioning",
            weight: 1,
          },
        ],
      },
    ],
  },
  "other-education": {
    name: t("Other Educaton Facilities"),
    parent: "education",
    weight: weight,
    osmTags: [
      { key: "college", value: "adult_education" },
      { key: "education", value: "language_school" },
      { key: "education", value: "music_school" },
      { key: "education", value: "prep_school" },
      { key: "education", value: "facultative_school" },
      { key: "education", value: "dancing_school" },
      { key: "education", value: "cooking_school" },
      { key: "education", value: "ski_school" },
      { key: "education", value: "sailing_school" },
      { key: "education", value: "art_school" },
      { key: "amenity", value: "dancing_school" },
      { key: "amenity", value: "first_aid_school" },
      { key: "amenity", value: "language_school" },
      { key: "amenity", value: "library" },
      { key: "amenity", value: "surf_school" },
      { key: "amenity", value: "research_institute" },
      { key: "amenity", value: "music_school" },
      { key: "amenity", value: "traffic_park" },
    ],
    description: t(
      "Includes specialized education facilities such as language schools, music schools, dance schools, cooking schools, libraries, research institutes, and other vocational or specialized education providers.",
    ),
    sql: {
      from: osm_amenities,
      where: sql`(${sql.join(
        [
          sql`${osm_amenities.tags}->'college' = 'adult_education'`,
          sql`${osm_amenities.tags}->'education' = 'language_school'`,
          sql`${osm_amenities.tags}->'education' = 'music_school'`,
          sql`${osm_amenities.tags}->'education' = 'prep_school'`,
          sql`${osm_amenities.tags}->'education' = 'facultative_school'`,
          sql`${osm_amenities.tags}->'education' = 'dancing_school'`,
          sql`${osm_amenities.tags}->'education' = 'cooking_school'`,
          sql`${osm_amenities.tags}->'education' = 'ski_school'`,
          sql`${osm_amenities.tags}->'education' = 'sailing_school'`,
          sql`${osm_amenities.tags}->'education' = 'art_school'`,
          sql`${osm_amenities.amenity} = 'dancing_school'`,
          sql`${osm_amenities.amenity} = 'first_aid_school'`,
          sql`${osm_amenities.amenity} = 'language_school'`,
          sql`${osm_amenities.amenity} = 'library'`,
          sql`${osm_amenities.amenity} = 'surf_school'`,
          sql`${osm_amenities.amenity} = 'research_institute'`,
          sql`${osm_amenities.amenity} = 'music_school'`,
          sql`${osm_amenities.amenity} = 'traffic_park'`,
        ],
        sql` OR `,
      )})`,
    },
    topics: genericEducationTopics,
  },
  "driving-schools": {
    name: t("Driving Schools"),
    parent: "education",
    weight: weight,
    osmTags: [
      { key: "amenity", value: "driving_school" },
      { key: "education", value: "driving_school" },
    ],
    description: t("Includes driving schools."),
    sql: {
      from: osm_amenities,
      where: sql`(${sql.join(
        [
          sql`${osm_amenities.amenity} = 'driving_school'`,
          sql`${osm_amenities.tags}->'education' = 'driving_school'`,
        ],
        sql` OR `,
      )})`,
    },
    topics: [
      {
        topicId: "mobility",
        criteria: [
          {
            criterionId: "is-wheelchair-accessible",
            weight: 0.5,
          },
          {
            criterionId: "has-wheelchair-accessible-toilet",
            weight: 0.5,
          },
        ],
      },
      {
        topicId: "hearing",
        criteria: [
          {
            criterionId: "is-accessible-to-hearing-impaired",
            weight: 1,
          },
        ],
      },
      {
        topicId: "general-assistance",
        criteria: [
          {
            criterionId: "has-website",
            weight: 1,
          },
        ],
      },
      {
        topicId: "air-and-climate",
        criteria: [
          {
            criterionId: "has-air-conditioning",
            weight: 1,
          },
        ],
      },
    ],
  },
});
