# ADR 2 - Initial Technology Choices

## Status
✅ Accepted on 2025-04-28

## Context
To build a robust and scalable system, we first need to decide on our technology stack.

We previously built a prototype of the algorithm to assess its feasibility. During this proof-of-concept phase, we found that the best publicly accessible data on accessibility of public spaces is available on [OpenStreetMap](https://wiki.openstreetmap.org/) (OSM).

## Decision
We will use data from OSM and adopt [OSM tags](https://wiki.openstreetmap.org/wiki/Tags) as the standard input data format for the a11yscore algorithm. OSM tags provide a well-defined standard for describing public spaces and their accessibility. We also considered using the [a11yjson](https://sozialhelden.github.io/a11yjson/) standard but decided against it due to the significant overhead in terms of performance and complexity that would arise from converting data from sources like OSM to a11yjson.

We will import data from all relevant data sources (initially only OSM) into a [PostgreSQL](https://www.postgresql.org/) database. This allows for efficient data analysis using plain SQL queries, leveraging the [PostGIS extension](https://postgis.net/) to support geospatial queries. PostgreSQL is a performant, well-supported, and widely used technology that enables optimized computationally intensive operations at the database layer. We also considered using big-data analysis tools like [Apache Spark](https://spark.apache.org/) but decided against it due to our lack of experience with these systems. Moreover, using a simpler technology like SQL makes it easier for others and the public to understand the algorithm's implementation and contribute to it. We also considered existing solutions that allow querying OSM data directly, such as the [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) or the [Ohsome API](https://wiki.openstreetmap.org/wiki/Ohsome_API). These are suited for smaller queries and/or datasets and does not scale well enough for our needs.

For importing OSM data into the PostgreSQL database, we will use [imposm3](https://imposm.org/docs/imposm3/latest/) and the [Planet OSM file](https://planet.openstreetmap.org/). imposm3 is highly performant and currently the most reliable tool for this purpose. We decide to store only data derived from the latest version of the OSM planet file in our database and incrementally update it using the respective imposm3 feature, ensuring that our database remains up-to-date with the latest changes in OSM. This means that we will not store and analyze historical data to reduce complexity, infrastructure costs and make the project more feasible. We will still store the results of our regular analyses in a separate database to allow for historical comparisons of the results back to the point in time when the software was initially launched.

For programming the algorithm, we will use [TypeScript](https://www.typescriptlang.org/). We chose TypeScript because it is a modern language with strong typing and wide adoption. Although we considered alternatives like [Rust](https://www.rust-lang.org/) and [Go](https://go.dev/) due to their performance benefits, we decided against them due to their steep learning curve, lesser adoption, and for uniformity with our existing tech stack. Since computational intensive parts of the algorithm are executed on the database level using SQL queries, the performance of the programming language itself is less critical. We are optimistic that TypeScript, combined with a fast and modern runtime, will be performant enough for our needs. By using TypeScript, we also enable more developers and the public to understand the algorithm's implementation and contribute to it.

## Consequences
Any additional data sources we wish to include in the future must either be converted to OSM tags or added to OpenStreetMap to be used by the algorithm. We prefer the latter option, hoping to convince stakeholders to publish their data openly on OSM, benefiting more projects that rely on open data besides a11yscore.

Importing the entire OSM planet file into a PostgreSQL database using imposm3 requires significant disk space, memory, and computational resources, making it inefficient for machines commonly used for development. We will need to develop tools and processes to work efficiently with the a11yscore algorithm in the future.

There is a small risk that TypeScript could become a bottleneck at some point in the future. However, since most of the algorithmic logic lies in SQL queries, switching the underlying programming language should not be a significant problem.
