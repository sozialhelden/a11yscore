# ADR 4 - Scoring Algorithm Design

## Status
✅ Accepted on 2025-07-21

## Context
Open Street Map as our primary data source offers a wide range of information on places all around the world. In order to aggregate available accessibility-relevant details into a comparable score (a single number), it is crucial to group relevant tags into clusters, as well as to define a method how to process and weigh the data points into meaningful values by respecting factors like varying importance and missing data.

## Decision

### Criteria Score

#### Scoring
As established in ADR 3, the algorithm breaks down the accessibility of the physical world using a tree of _categories_ (e.g. food & drinks), where each _sub-category_ (e.g. restaurant) has a list of _criteria_ (e.g. wheelchair-accessible) grouped into _topics_ (.e.g. mobility). 

Each criterium directly corresponds to a calculation based on OSM tags and their values - for now - and translates into a numeric single score of integer values (points).

A score of 100 points for a criterium means, we consider a place to be fully accessible for that specific criterium. However, we include the possibility to have a score of more than 100 points in order to be able to reward outstanding efforts if special features are present, e.g. "Changing Place" toilets.

Depending on the nature of the OSM tags used, the scores of single places/geometries within a criterium will be averaged. We choose either median (in case of counts that should not be sensitive to outliers) or arithmetic mean (in case of lengths, areas or outlier sensitive counts) for averaging.

#### Selection
For the first version of the score we will focus only on existing OSM tags and only on those that can be translated into numeric values in a straightforward way. For example, we will use the "wheelchair" and the "blind" tag since their values can only be "yes", "limited", "no", if tagged correctly. The strings can then be translated into points, e.g. yes => 100 points, limited => 50 points, no => 10 points.

> [!NOTE]
> This incentivizes the mere presence of a tag by giving at least some positive number of points for each value. Zero points will be given if a tag is missing entirely or tagged wrongly.

> [!NOTE]
> For the first version we will omit tags for which scoring is more complex, e.g. entrances since they require bundling of multiple semantically overlapping tags, or surfaces since they require computation of areas.

### Topic Score
All individual criteria scores within a topic for a given category will be aggregated into a single topic score. This will be done by applying weights to each individual criterium within a given topic. For example: in the "mobility" topic, the "wheelchair-accessibility" criterium should probably be weighted more heavily than the "accepts-credit-cards" criterium.

### Sub-Category Score
To compute the sub-category score, all individual topic scores will be determined and averaged. Since the topics correspond to different groups of accessibility needs, there will be no weighing factors applied for averaging.

### Category Score
The scores of all sub-categories are compiled in a weighted average to form an overall score of the category.

### Region Score
Finally, the scores of all categories are compiled into an overall score for the region by a weighted average.

The examples made in this text are purely illustrative and do not reflect the actual criteria, topics, categories, OSM-tags, weights or point values that will be used in the a11y-Score algorithm. We decided to define and refine those incrementally as we move forward and as we gain more data from research, analysis and feedback.

## Consequences

We decided to use a points/integer based scoring system instead of percentages. This means we need to explain the point system to users more thoroughly, as it is not as intuitive as percentages. We strongly believe an arbitrary point system is better suited to score the accessibility as a percentage based score could lead to a lot of preconceptions.

The scoring algorithm includes a lot of weighting factors, which will allow us to adjust the importance of different criteria and categories over time. We will need to very carefully choose these weights and adjust them based on user-feedback and future research. In order to make the algorithm transparent and understandable, we also need to document all weights and the reasoning for them in detail.

For the MVP and the first couple of versions of the algorithm, we decided to initially omit certain tags and not include complex criteria which may lead to an incomplete picture of accessibility, but enables quick implementation and fast iterations.

The reliance on data from Open Street Map could introduce biases if the data is incomplete or varies significantly between regions, leading to skewed scores. To cater that, this scoring mechanism is designed to encourage users to accurately reflect the accessibility features of their locations by incentivizing tagging (a negative tag gets more points than a missing tag). To further mitigate this, we need to work with population data and thresholds for data quality in the future. 

