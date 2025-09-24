# ADR 6 - Data Quality and Thresholds

## Status
✅ Accepted on 2025-09-24

## Context
Many criteria we use to calculate scores are based on Open Street Map (OSM) tags that are not widely used. For example, the `deaf` or `blind` tags are used very sparsely.

This means, that for the current implementation, those scores will be very low or even 0 in most areas as the data is not available. This most likely does not represent the actual situation in the real world.

So the scoring system needs to take into account the lack of data as well as low data quality without penalizing scores too much while still encouraging the collection of new data, even if the newly collected data is bad in terms of accessibility.

## Decision
### Quality factor
We decide to implement a data quality factor for each individual criterion. This will affect the overall weight of the criterion score within a topic score. The data quality factor will be a value between `0` and `1`, where `0` means no data quality and `1` means perfect data quality. It will be multiplied with the weight of the criterion score, which will then be normalized again to ensure that the sum of all weights is still `1`.

If the data quality is low, the weight of the criterion score will be reduced, meaning that it will have less impact on the overall topic score. Conversely, if the data quality is high, the weight of the criterion score will be increased, meaning that it will have more impact on the overall topic score.

As some topics only consist of a single criterion, we will also calculate a data quality factor for each topic score by using a weighted average of the individual criteria data quality factors as we already have weights for each criterion. This will ensure that topics with low data quality will also have less impact on the sub-category score.

Judging from our experiments with the data, the implementation of a data quality factor on the sub or top-level category level is probably not needed right now, but can be added in the future.

### Measuring data quality
Data quality should be measured in different ways depending on the criterion and the given area.

We decide to start with measuring data quality by relative frequency, i.e. how many objects in the given area have an OSM tag compared to all objects of the same type in the given area.

In the future we can also take more metrics into account for the data quality factor, e.g. the number of OSM contributors in the given area, as more contributors usually means better data quality.

We will display the data quality in the frontend as well, so users can see how reliable a score is. For this we will use a traffic light system with three levels: low (C), medium (B) and high (A) data quality, where `low <= 20% <= medium <= 70% <= high`. 

### Thresholds
We will also implement a threshold, so that the frontend will not display scores with a data quality lower than `10%`. Scores with a data quality less than `10%` will still be used for calculation, but not displayed to the user as they will have a low impact on the score anyway.

### Example

Example of how the data quality factor will affect the overall score:

| -                                                  | Criterion 1 | Criterion 2 | Criterion 3 |
|----------------------------------------------------|-------------|-------------|-------------|
| Calculated Score                                   | 60          | 30          | 5           |
| Original weight                                    | 0.4         | 0.3         | 0.3         |
| Total geometry<sup>1</sup>                         | 100         | 80          | 150         |
| Tagged geometry<sup>1</sup>                        | 90          | 40          | 25          |
| Data quality factor<sup>2</sup>                    | 0.9         | 0.5         | 0.17        |
| Data quality adjusted weight<sup>3</sup>           | 0.36        | 0.15        | 0.05        |
| Normalized data quality adjusted weight<sup>4<sup> | 0.64        | 0.27        | 0.09        |
| Originally weighted score                          | **24**      | **9**       | **2**       |
| New weighted score                                 | **38**      | **8**       | **0**       |

Original topic score: (24 + 9 + 2) = **35**  
New topic score: (38 + 8 + 0) = **46**

1. Geometry = the number of POIs, surface area, etc.
2. Data quality factor = tagged geometry / total geometry
3. Data quality adjusted weight = original weight * data quality factor
4. Normalized data quality adjusted weight = 1 / sum of all data quality adjusted weights * data quality adjusted weight

## Consequences

This decision will lead to more reliable scores. It will also encourage the collection of new data, as every new data point improves the data quality factor and thus the resulting score.

It can and will lead to more processing time. The thresholds and formulas need to be adjusted over time as we learn more about the data and its quality.
