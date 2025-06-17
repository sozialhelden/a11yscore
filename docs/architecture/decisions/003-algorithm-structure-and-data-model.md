# ADR 3 - Algorithm Structure and Data Model

## Status
✅ Accepted on 2025-06-17

## Context
The a11y-Score project aims to calculate a score for regions that reflects the accessibility of the physical world and provide concrete actionable tasks organizations and governments can take to improve accessibility in their area.

To achieve this, we need to define a structure and data model that is suitable for calculating accessibility scores and providing actionable insights. From decades of research, we know most typical and niche accessibility requirements for domains like gastronomy, sanitary facilities, hotels, or public transit. So the goal of the structure and data model is to break down the accessibility of the physical world into such small parts, that can then be evaluated properly.

## Decision
We will use the [United Nations Sustainable Development Goals (SDGs)](https://sdgs.un.org/goals) as a foundational layer. This helps us to align our evaluation criteria with global standards and priorities, ensuring that our work contributes to broader societal goals.

We will define broad **CATEGORIES** such as e.g. "Mobility", "Food & Drinks" or "Culture" that align closely and are related to one or more SDGs. These broad categories will be further divided into more specific sub categories, such as e.g. "Public Transport", "Restaurants", "Museums". We will create a hierarchical structure of categories and sub categories to break down the accessibility of the physical world to small manageable and evaluable parts.

We will define individual **CRITERIA** such as e.g. "accessible by wheelchair", "has a tactile guidance system" or "has a digital menu". These criteria define actual requirements that a place must meet in order to be considered accessible.

To evenly evaluate the physical world across different needs and disabilities, we cluster criteria into **TOPICS**, such as e.g. "Mobility", "Visual", "Auditory". So, we can say that a place is accessible for people with mobility impairments if it meets all criteria in the "Mobility" topic.

The actual relation between criteria and topics happens individually for each category at the very bottom of the category tree. So, we can define for each sub-category which criteria must be met in each topic in order for this topic to be evaluated as accessible. To stay with the restaurant example, in order to be accessible in the "Visual" topic, a restaurant must meet the criteria "has a digital menu" and "has a tactile guidance system". While "has a digital menu" is a good criterion for a restaurant, it is not relevant for a public transport stop. By assigning criteria to a sub category and grouping them by topics, we can ensure that the evaluation is contextually relevant and meaningful. It also allows us to give actionable advice. When the score for the "has a digital menu" criterion for "restaurants" in a region is low, we can recommend restaurants to add a digital menu to improve accessibility for people with visual impairments.

The examples made in this text are purely illustrative and do not reflect the actual criteria, topics or categories that will be used in the a11y-Score algorithm. We decided to define and refine those incrementally as we move forward and as we gain more data from research, analysis and feedback.

## Consequences
By splitting the accessibility of the physical world into categories, sub categories, criteria and topics, we create a structured and manageable way to evaluate accessibility at a small level and then aggregate it to a larger level. We can use this structure to add weights to criteria and categories to further refine the scoring algorithm.

The downside of this structure is, that instead of calculating a single score/datapoint, we need to calculate and save a score for each combination of criterion/topic/category, increasing the periodically generated data volume. However, this is a necessary trade-off to ensure that we can provide actionable insights and recommendations for improving accessibility.

Another downside is, that there are plenty of criteria to assess the accessibility of a place, which makes it nearly impossible to evaluate all of them at once. We will need to prioritize which criteria are most important and focus on those first, iteratively adding more criteria as we go along. This will probably lead to less accurate results in the beginning, but it allows us to gather feedback and refine our criteria based on real-world data and user input.
