# ADR 4 - Scoring Algorithm Design

## Status

🔍 Proposed 

## Context

Open Street Map as our primary data source offers a wide range of information on places all around the world. In order to
to aggregate available accessibilty-relevant details into a comparable score (a single number) it is crucial to group 
relevant tags into clusters, as well as to define a method how to process and weigh the data points into 
meaningful values by respecting factors like varying importance and missing data. 

## Decision

### Taxonomy

The smallest entities of the algorithm are called _criteria_ and will, for now, directly correspond to OSM tags with their values being translated into a numeric single score.

The overall score for a selected region will then be composed of sub-scores that are computed along two dimensions:

1. _Categories and Sub-Categories_: The data points are grouped by place type into a hierarchical structure of categories, e.g. "Food and Drinks", with sub-categories "Restaurant", "Bar", "Bakery"; "Culture" with sub-categories "Theater", "Opera House" etc. 
2. _Topics_: Each place within a category can score on different selected criteria which are grouped into topics, based on the accessibility need that they serve, e.g. "Mobility" with OSM tag "wheelchair"; "Neurodivergent" with OSM tag "quiet_hours", etc.

For each sub-category, the sum of single scores per topic is divided by the _volume_ of the sub-category. Depending on the nature of the places in the sub-category and the tags in each topic, a volume can be the number of places, a total length (e.g for surfaces of ways), a total area or other.

### Selection and Scoring of Criteria
For the first version of the score we will focus only on existing OSM tags and only on those that can be translated into numeric values in a straightforward way.
For example, we will use the "wheelchair" and the "blind" tag since their values can only be "yes", "limited", "no", if tagged correctly. We will ignore wrongly tagged values like "wheelchair=xyz". The strings can then be translated into points, e.g. yes => 100, limited => 50, no => 10. Note that we will incentivize the mere presence of a tag by giving at least some positive number of points for each value. Zero points will be given if a tag is missing entirely. 
For the first version we will omit tags for which scoring is more complex, e.g. entrances since they require bundling of multiple semantically overlapping tags, or surfaces since they require computation of areas.  
All tags belonging to the same topic will be assigned a maximum number of points so that the total adds up to 100 points regularly. This approach allows for translation of points in percentages. However, we include the possibility for topics to have a score of more than 100 points in order to be able to reward outstanding efforts if special features are included in a place, e.g. "Changing Places" toilet rooms.

### Topic Score
Depending on the nature of the tags within a topic, all single scores for each place in the sub-category will be averaged along that topic. We choose either median (in case of counts that should not be sensitive to outliers) or arithmetic mean (in case of lengths, areas or outlier sensitive counts) for averaging.

### Sub-Category Score
To compute the sub-category score, all individual topic scores will be determined and averaged. Since the topics correspond to different groups of accessibility needs, there will be no weighing factors applied for averaging. 

### Category Score
The scores of all sub-categories are compiled in a weighted average to form an overall score of the category. The weights are yet to be determined.

### Region Score
Finally, the scores of all categories are compiled into an overall score for the region by a weighted average. The weights are yet to be determined.


### Weighting by Volumes
In the future, we want to include more differentiated data in order to better reflect varying conditions of regions and places in the score. 
For categories in which places are tagged with a "capacity" tag, it could be a viable approach to weigh the number of, for example, restaurants or stadiums by the amount of seating options available in each of them. Currently, this tag is not common enough to be inlcuded into the score without a risk of introducing noise, since it is not clear how to handle places where this tag is missing. For places that are saved to open street map as ways (areas) we can use the area as weighting factor, similar as capacity. Furthermore, we will include population data into the score in order to not only reflect the tagging of places but also mere presence and density in a given area in the score. Like this, metrics like "number of restaurants per 1000 inhabitants" can be included in the score. 
Moreover, it is possible to define thresholds as minimal requirements to be met for a certain score, e.g "Have at least one wheelchair accessible gynecologist per 100 inhabitants". 


## Consequences

By including topics for specific accessibility needs (e.g., neurodivergent considerations), the algorithm can serve a broader range of users and highlight issues that might be overlooked.
However, for this MVP we decided to initially omit certain tags and not include complex criteria which may lead to an incomplete picture of accessibility, but enables quick implementation and fast iterations.
The reliance on data from Open Street Map could introduce biases if the data is incomplete or varies significantly between regions, leading to skewed scores. To cater that, this scoring mechanism is designed to encourage users to accurately reflect the accessibility features of their locations by incentivizing tagging (a negative tag gets more points than a missing tag).
Future enhancements that involve weighting scores by volume (e.g., capacity) or incorporating population data may introduce complexity and require extensive analysis to determine fair and effective weights but we consider this necessary in order to create a meaningful and comparable score.

