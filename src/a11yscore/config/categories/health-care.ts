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

export type HealthCareTopLevelCategoryId = "health-care";
export const getHealthCareTopLevelCategory = ({
  t,
  weight,
}: {
  t: Translate;
  weight: number;
}): Record<HealthCareTopLevelCategoryId, Omit<TopLevelCategory, "id">> => ({
  "health-care": {
    name: t("Health Care"),
    sustainableDevelopmentGoals: [3, 10, 5],
    weight,
    interpretation: (score) => {
      if (score >= 75)
        return t("Most of the health care facilities are accessible.");
      if (score >= 50)
        return t("Many of the health care facilities are accessible.");
      if (score >= 30)
        return t("Some of the health care facilities are accessible.");
      if (score > 0)
        return t("Only a few of the health care facilities are accessible.");

      return t("The score could not be determined due to missing data.");
    },
    description: t(
      "This category includes medical services and facilities, including hospitals, doctors' offices, pharmacies, clinics, and specialized therapy or counselling centers.",
    ),
  },
});

/*
 * sub categories
 */

const genericHealthCareTopics: SubCategory["topics"] = [
  {
    topicId: "mobility",
    criteria: [
      {
        criterionId: "is-wheelchair-accessible",
        weight: 0.8,
      },
      {
        criterionId: "has-wheelchair-accessible-toilet",
        weight: 0.2,
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
    topicId: "toilet",
    criteria: [
      {
        criterionId: "has-toilet",
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
];

export type HealthCareSubCategoryId =
  //| "unknown-health-care"
  | "health-counselling"
  | "doctors"
  | "hospitals"
  | "clinics"
  | "pharmacies"
  | "therapists"
  | "psycho-therapists"
  | "other-health-facilities"
  | "health-shops";

const weight = 1 / 9;

export const getHealthCareSubCategories = (
  t: Translate,
): Record<HealthCareSubCategoryId, Omit<SubCategory, "id">> => ({
  // "unknown-health-care": {
  //   name: t("Unknown Health Care"),
  //   parent: "health-care",
  //   weight: weight,
  //   osmTags: [{ key: "healthcare", value: "yes" }],
  //   description:
  //     t(
  //       "Includes any health care facility (doctors, hospitals, clinics, pharmacies, therapists, psycho therapists, medical shops, and other health facilities that are not further specified on Open Street Map).",
  //     ),
  //   sql: {
  //     from: osm_amenities,
  //     where: sql`${osm_amenities.healthcare} = 'yes'`,
  //   },
  //   topics: genericHealthCareTopics,
  // },
  "health-counselling": {
    name: t("Health Counselling"),
    parent: "health-care",
    weight: weight,
    osmTags: [
      { key: "healthcare:counselling", value: "dietitian" },
      { key: "healthcare:counselling", value: "nutrition" },
      { key: "healthcare:counselling", value: "sexual" },
      { key: "healthcare:counselling", value: "antenatal" },
      { key: "healthcare:counselling", value: "psychiatry" },
    ],
    description: t(
      "Includes facilities providing health counselling services such as dietitians, nutritionists, sexual health counselling, antenatal counselling, and psychiatric services.",
    ),
    sql: {
      from: osm_amenities,
      where: sql`(${sql.join(
        [
          sql`${osm_amenities.tags}->'healthcare:counselling' = 'dietitian'`,
          sql`${osm_amenities.tags}->'healthcare:counselling' = 'nutrition'`,
          sql`${osm_amenities.tags}->'healthcare:counselling' = 'sexual'`,
          sql`${osm_amenities.tags}->'healthcare:counselling' = 'antenatal'`,
          sql`${osm_amenities.tags}->'healthcare:counselling' = 'psychiatry'`,
        ],
        sql` OR `,
      )})`,
    },
    topics: genericHealthCareTopics,
  },
  doctors: {
    name: t("Doctors and Medical Practices"),
    parent: "health-care",
    weight: weight,
    osmTags: [
      { key: "amenity", value: "doctors" },
      { key: "healthcare", value: "doctor" },
      { key: "healthcare", value: "dentist" },
      { key: "amenity", value: "dentist" },
      { key: "amenity", value: "veterinary" },
      { key: "healthcare", value: "audiologist" },
      { key: "healthcare", value: "nurse" },
      { key: "healthcare", value: "optometrist" },
      { key: "healthcare", value: "podiatrist" },
    ],
    description: t(
      "Includes all types of doctors' offices, medical practices, dental clinics, veterinarians, audiologists, nurses, optometrists, and podiatrists.",
    ),
    sql: {
      from: osm_amenities,
      where: sql`(${sql.join(
        [
          sql`${osm_amenities.amenity} = 'doctors'`,
          sql`${osm_amenities.amenity} = 'dentist'`,
          sql`${osm_amenities.amenity} = 'veterinary'`,
          sql`${osm_amenities.healthcare} = 'doctor'`,
          sql`${osm_amenities.healthcare} = 'dentist'`,
          sql`${osm_amenities.healthcare} = 'audiologist'`,
          sql`${osm_amenities.healthcare} = 'nurse'`,
          sql`${osm_amenities.healthcare} = 'optometrist'`,
          sql`${osm_amenities.healthcare} = 'podiatrist'`,
        ],
        sql` OR `,
      )})`,
    },
    topics: genericHealthCareTopics,
  },
  hospitals: {
    name: t("Hospitals"),
    parent: "health-care",
    weight: weight,
    osmTags: [
      { key: "amenity", value: "hospital" },
      { key: "healthcare", value: "hospital" },
    ],
    description: t(
      "Public or private hospitals providing full medical care and in-patient facilities.",
    ),
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.amenity} = 'hospital' or ${osm_amenities.healthcare} = 'hospital' `,
    },
    topics: genericHealthCareTopics,
  },
  clinics: {
    name: t("Clinics and Outpatient Centers"),
    parent: "health-care",
    weight: weight,
    osmTags: [
      { key: "amenity", value: "clinic" },
      { key: "healthcare", value: "clinic" },
    ],
    description: t(
      "Includes walk-in clinics, medical centres (including MVZs), outpatient care, and specialty clinics.",
    ),
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.amenity} = 'clinic' or ${osm_amenities.healthcare} = 'clinic'`,
    },
    topics: genericHealthCareTopics,
  },
  pharmacies: {
    name: t("Pharmacies"),
    parent: "health-care",
    weight: weight,
    osmTags: [{ key: "amenity", value: "pharmacy" }],
    description: t(
      "Includes pharmacies and dispensaries, where prescription and over-the-counter medicines are sold.",
    ),
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.amenity} = 'pharmacy'`,
    },
    topics: genericHealthCareTopics,
  },
  therapists: {
    name: t("Therapy and Alternative Medicine Centers"),
    parent: "health-care",
    weight: weight,
    osmTags: [
      { key: "healthcare", value: "alternative" },
      { key: "healthcare", value: "occupational_therapist" },
      { key: "healthcare", value: "speech_therapist" },
      { key: "healthcare", value: "physiotherapist" },
    ],
    description: t(
      "Facilities for physical therapy, occupational therapy, speech therapy, physiotherapy, and practices in alternative medicine.",
    ),
    sql: {
      from: osm_amenities,
      where: sql`(${sql.join(
        [
          sql`${osm_amenities.healthcare} = 'alternative'`,
          sql`${osm_amenities.healthcare} = 'occupational_therapist'`,
          sql`${osm_amenities.healthcare} = 'speech_therapist'`,
          sql`${osm_amenities.healthcare} = 'physiotherapist'`,
        ],
        sql` OR `,
      )})`,
    },
    topics: genericHealthCareTopics,
  },
  "psycho-therapists": {
    name: t("Psychotherapy Practices"),
    parent: "health-care",
    weight: weight,
    osmTags: [{ key: "healthcare", value: "psychotherapist" }],
    description: t(
      "Offices and centers where psychotherapists offer mental health counseling and support.",
    ),
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.healthcare} = 'psychotherapist'`,
    },
    topics: genericHealthCareTopics,
  },
  "other-health-facilities": {
    name: t("Other Health Facilities"),
    parent: "health-care",
    weight: weight,
    osmTags: [
      { key: "amenity", value: "health_post" },
      { key: "healthcare", value: "blood_donation" },
      { key: "healthcare", value: "dialysis" },
      { key: "healthcare", value: "hospice" },
      { key: "healthcare", value: "midwife" },
      { key: "healthcare", value: "rehabilitation" },
      { key: "healthcare", value: "sample_collection" },
      { key: "healthcare", value: "vaccination_centre" },
      { key: "healthcare", value: "birthing_centre" },
      { key: "healthcare", value: "postpartum_care" },
    ],
    description: t(
      "Includes health posts, blood donation centers, dialysis centers, hospices, midwife care, rehabilitation, sample collection sites, vaccination centers, birthing centers, and postpartum recovery facilities.",
    ),
    sql: {
      from: osm_amenities,
      where: sql`(${sql.join(
        [
          sql`${osm_amenities.amenity} = 'health_post'`,
          sql`${osm_amenities.healthcare} = 'blood_donation'`,
          sql`${osm_amenities.healthcare} = 'dialysis'`,
          sql`${osm_amenities.healthcare} = 'hospice'`,
          sql`${osm_amenities.healthcare} = 'midwife'`,
          sql`${osm_amenities.healthcare} = 'rehabilitation'`,
          sql`${osm_amenities.healthcare} = 'sample_collection'`,
          sql`${osm_amenities.healthcare} = 'vaccination_centre'`,
          sql`${osm_amenities.healthcare} = 'birthing_centre'`,
          sql`${osm_amenities.healthcare} = 'postpartum_care'`,
        ],
        sql` OR `,
      )})`,
    },
    topics: genericHealthCareTopics,
  },
  "health-shops": {
    name: t("Medical Supply & Specialized Health Shops"),
    parent: "health-care",
    weight: weight,
    osmTags: [
      { key: "shop", value: "medical_supply" },
      { key: "shop", value: "optician" },
      { key: "amenity", value: "hearing_aids" },
      { key: "shop", value: "dentures" },
      { key: "shop", value: "herbalist" },
    ],
    description: t(
      "Shops or stores specializing in medical supplies, visual aids, hearing aids, dentures, and herbal medicine products.",
    ),
    sql: {
      from: osm_amenities,
      where: sql`(${sql.join(
        [
          sql`${osm_amenities.shop} = 'medical_supply'`,
          sql`${osm_amenities.shop} = 'optician'`,
          sql`${osm_amenities.shop} = 'dentures'`,
          sql`${osm_amenities.shop} = 'herbalist'`,
          sql`${osm_amenities.amenity} = 'hearing_aids'`,
        ],
        sql` OR `,
      )})`,
    },
    topics: genericHealthCareTopics,
  },
});
