import { dummyTranslate, type Translate } from "~/utils/i18n";
import {
  getSubCategories,
  getTopLevelCategories,
  type SubCategory,
  type SubCategoryId,
  type TopLevelCategoryId,
} from "~~/src/a11yscore/config/categories";
import {
  type Criterion,
  type CriterionId,
  getCriteria,
} from "~~/src/a11yscore/config/criteria";
import {
  getSustainableDevelopmentGoals,
  type SustainableDevelopmentGoal,
  type SustainableDevelopmentGoalId,
} from "~~/src/a11yscore/config/sdgs";
import {
  getTopics,
  type Topic,
  type TopicId,
} from "~~/src/a11yscore/config/topics";

/*
 * Top-level categories
 */
export const getTopLevelCategoryList = (t?: Translate) =>
  Object.values(getTopLevelCategories(t ?? dummyTranslate));
export const getTopLevelCategoryIds = () =>
  Object.keys(getTopLevelCategories(dummyTranslate)) as TopLevelCategoryId[];
export const getTopLevelCategoryById = (
  id: TopLevelCategoryId,
  t?: Translate,
) => getTopLevelCategories(t ?? dummyTranslate)[id];
export function getChildCategories(
  parent: TopLevelCategoryId,
  t?: Translate,
): SubCategory[] {
  return getSubCategoryList(t).filter(
    (category) => (category as SubCategory)?.parent === parent,
  );
}

/*
 * Sub-categories
 */
export const getSubCategoryList = (t?: Translate) =>
  Object.values(getSubCategories(t ?? dummyTranslate));
export const getSubCategoryIds = () =>
  Object.keys(getSubCategories(dummyTranslate)) as SubCategoryId[];
export const getSubCategoryById = (id: SubCategoryId, t: Translate) =>
  getSubCategories(t ?? dummyTranslate)[id];

/*
 * Topics
 */
export const getTopicList = (t?: Translate): Topic[] =>
  Object.values(getTopics(t ?? dummyTranslate));
export const getTopicById = (id: TopicId, t?: Translate): Topic => {
  return getTopics(t ?? dummyTranslate)[id];
};

/*
 * Criteria
 */
export const getCriterionList = (t?: Translate): Criterion[] =>
  Object.values(getCriteria(t ?? dummyTranslate));
export const getCriterionById = (id: CriterionId, t?: Translate): Criterion => {
  return getCriteria(t ?? dummyTranslate)[id];
};

/*
 * Sustainable Development Goals
 */
export const getSustainableDevelopmentGoalList = (
  t?: Translate,
): SustainableDevelopmentGoal[] =>
  Object.values(getSustainableDevelopmentGoals(t ?? dummyTranslate));
export const getSustainableDevelopmentGoalById = (
  id: SustainableDevelopmentGoalId,
  t?: Translate,
): SustainableDevelopmentGoal => {
  return getSustainableDevelopmentGoals(t ?? dummyTranslate)[id];
};
