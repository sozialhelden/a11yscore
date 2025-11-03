# ADR 6 - Data Quality and Thresholds

## Status
✅ Accepted on 2025-10-30

## Context
Many criteria we use to calculate scores are based on OpenStreetMap (OSM) tags that are not widely used. For example, the `deaf` or `blind` tags are used very sparsely.

This means, that for the current implementation, those scores will be very low or even 0 in most areas as the data is not available. This most likely does not represent the actual situation in the real world.

In addition, there are some regions for which there are no places or geometry present at all for a certain category. E.g. the food-court category in rural areas might not have any data, as there are no food courts in those areas.

So the scoring system needs to take into account the lack of data as well as low data quality without penalizing scores too much, while still encouraging the collection of new data, even if the newly collected data is bad in terms of accessibility.

## Decision
### Exemption of empty sub-category scores
We decide to exempt sub-category scores for which no places/geometry are present in the given region. This means that if a sub-category has no data, it will not be included in the calculation of the overall top-level category score. In addition, the weights of other sub-categories in the same top-level category must be normalized to ensure that all weights still sum up to `1`.

### Data quality

#### Introduction of a data quality factor
We decide to implement a data quality factor for each individual criterion. This will affect the overall weight of the criterion score within a topic score. The data quality factor will be a value between `0.2` and `1`, where `0.2` means no data quality and `1` means perfect data quality. It will be multiplied with the weight of the criterion score, which will then be normalized to ensure that all weights still sum up to `1`. We chose this range to make sure, that a criterion with bad data quality still has some impact on the score.

This implies: If the data quality is low, the weight of the criterion score will be reduced, meaning that it will have less impact on the overall topic score. Conversely, if the data quality is high, the weight of the criterion score will be increased, meaning that it will have more impact on the overall topic score.

As some topics only consist of a single criterion, we will also calculate a data quality factor for each topic score by using a weighted average of the individual criteria data quality factors as we already have weights for each criterion. This will ensure that topics with low data quality will also have less impact on the sub-category score.

Judging from our experiments with the data, the implementation of a data quality factor on the sub or top-level category level is probably not needed right now, but can be added in the future.

#### Measuring data quality
Data quality should be measured in different ways depending on the criterion and the given area.

We decide to start with a lightweight solution by measuring data quality by relative frequency, i.e. how many objects in the given area have an OSM tag compared to all objects of the same type in the given area.

In the future we can also take more metrics into account for the data quality factor, e.g. the number of OSM contributors in the given area, as more contributors usually means better data quality.

We will display the data quality in the frontend as well, so users can see how reliable a score is. For this we will use a traffic light system with three levels: low (C), medium (B) and high (A) data quality, where `low <= 20% <= medium <= 70% <= high`.

#### Thresholds
We will also implement a threshold, so that the frontend will not display scores with a data quality lower than `10%`. Scores with a data quality less than `10%` will still be used for calculation, but not displayed to the user as they will have a low impact on the score anyway.

#### Data quality factor example
Example of how the data quality factor will affect the overall topic score. The float values are rounded for better readability:

| -                                                  | Criterion 1 | Criterion 2 | Criterion 3 |
|----------------------------------------------------|-------------|-------------|-------------|
| Calculated Score                                   | 60          | 30          | 5           |
| Original weight                                    | 0.4         | 0.3         | 0.3         |
| Total geometry<sup>1</sup>                         | 100         | 100         | 100         |
| Tagged geometry<sup>1</sup>                        | 90          | 50          | 17          |
| Data quality factor<sup>2</sup>                    | 0.9         | 0.5         | 0.17        |
| Data quality adjusted weight<sup>3</sup>           | 0.36        | 0.15        | 0.05        |
| Normalized data quality adjusted weight<sup>4<sup> | 0.64        | 0.27        | 0.09        |
| Originally weighted score                          | **24**      | **9**       | **2**       |
| New weighted score                                 | **38**      | **8**       | **0**       |

Original topic score = (24 + 9 + 2) = **35**  
New topic score = (38 + 8 + 0) = **46**  
Topic data quality factor = (0.4 * 0.9) + (0.3 * 0.5) + (0.3 * 0.17) = **0.57**

Where:

1. Geometry = the number of POIs, surface area, etc.
2. Data quality factor = tagged geometry / total geometry
3. Data quality adjusted weight = original weight * data quality factor
4. Normalized data quality adjusted weight = data quality adjusted weight / sum of all data quality adjusted weights

#### Data quality as an additional criterion
In addition to adjusting the weights of the criteria based on data quality, we will also add data quality as an additional criterion to each topic score. This means that each topic score will have an additional criterion internally, that is not shown in the frontend, that represents the data quality of the topic based on the topics own data quality factor. Whereby 100 points represent perfect data quality and 0 points represent no data quality.

This criterion will have a fixed weight of `0.2` in comparison to the other criterion scores, meaning that it will have a noticeable impact on the overall topic score. It will not be displayed in the frontend, and will only be used for calculation purposes.

This is meant to tackle a situation where a criterion has a very low data quality because of a lack of data. Then, for example in a mapping event, many of those tags are added for a given region, improving the data quality factor. But the overall score of the criterion does not improve (much), as the places/geometry are not accessible in regard of this criterion. This leads to the topic score getting worse, as the data quality adjusted weight of the criterion increases.

As we want to encourage the collection of new data even if it reveals bad accessibility, we need to offset this effect. By adding additional points based on data quality, this situation is mitigated successfully in our tests.

#### Data quality criterion example
Example of how the data quality criterion will affect the overall topic score. Let's take the previous example, but add more tagged geometry for criterion 3, improving its data quality factor, but keeping the score quite low due to bad real world accessibility.

| -                                                  | Criterion 1         | Criterion 2        | Criterion 3         |
|----------------------------------------------------|---------------------|--------------------|---------------------|
| Calculated Score                                   | 60                  | 30                 | ~~5~~ → **10**      |
| Original weight                                    | 0.4                 | 0.3                | 0.3                 |
| Total geometry<sup>1</sup>                         | 100                 | 100                | 100                 |
| Tagged geometry<sup>1</sup>                        | 90                  | 50                 | ~~17~~ → **80**     |
| Data quality factor<sup>2</sup>                    | 0.9                 | 0.5                | ~~0.17~~ → **0.8**  |
| Data quality adjusted weight<sup>3</sup>           | 0.36                | 0.15               | ~~0.05~~ → **0.24** |
| Normalized data quality adjusted weight<sup>4<sup> | ~~0.64~~ → **0.48** | ~~0.27~~ → **0.2** | ~~0.09~~ → **0.32** |
| Originally weighted score                          | **24**              | **9**              | ~~2~~ → **3**       |
| New weighted score                                 | ~~38~~ → **29**     | ~~8~~ → **6**      | ~~0~~ → **4**       |

Original topic score = ~~(24 + 9 + 2) = 35~~   
= **(24 + 9 + 3) = 36**  

New topic score = ~~(38 + 8 + 0) = 46~~  
= **(29 + 6 + 4) = 39**

Topic data quality factor ~~= (0.4 * 0.9) + (0.3 * 0.5) + (0.3 * 0.17) = **0.57*~~  
= (0.4 * 0.9) + (0.3 * 0.5) + (0.3 * 0.8) = **0.72**

By tagging more geometry for criterion 3, its data quality factor improved significantly, leading to a higher weight for its score. Because of it's low score, the overall topic score decreased from originally 46 to 39, even though the overall data quality factor for the topic improved from 0.57 to 0.72.

Now, let's add the data quality criterion with a weight of `0.2` to the topic score calculation:

New topic score = ~~(29 + 6 + 4) = 39~~  
= (29 + 6 + 4) * 0.8 + (0.72 * 100) * 0.2 = **46**

In this example, the additional data quality criterion offsets the negative impact of the increased data quality adjusted weight of criterion 3, leading to an overall topic score of 46, which is equal to the original topic score before adding more tagged geometry for criterion 3. In other examples we calculated it can even lead to a small topic score increase.

## Consequences

This decision will very surely lead to more reliable scores. It will also encourage the collection of new data, as every new data point improves the data quality factor and thus the data quality criterion and also the resulting score.

It can and will lead to more processing time. It will also complicate the algorithm and the resulting queries and code. This needs to be managed properly to ensure its long-term maintainability.

With the introduction of additional thresholds, individual weights and formulas, we need additional time and effort to validate and verify the results. The thresholds and weights will need to be adjusted over time as we learn more about the data and its quality. It will also quite surely require developer-tooling that generates statistical analysis and helps to analyze the effects of the data quality factor and criterion on scores in order to be able to adjust it properly.

