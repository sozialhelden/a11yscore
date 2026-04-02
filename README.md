<p align="center">
  <h1 align="center">a11yscore</h1>
  <p align="center">
    <strong>Rating the accessibility of the physical world — one city at a time.</strong>
  </p>
  <p align="center">
    <a href="https://a11yscore.org">Website</a> · <a href="./docs/index.md">Documentation</a> · <a href="https://sozialhelden.de">Sozialhelden e.V.</a>
  </p>
</p>

---

**a11yscore** is an open-source platform that computes accessibility scores for cities and regions based on [OpenStreetMap](https://www.openstreetmap.org/) data. It evaluates how accessible public infrastructure — such as transport, education, health care, and public spaces — is for people with different disabilities, and condenses this into transparent, comparable scores.

The project is being developed by [Sozialhelden e.V.](https://sozialhelden.de), a non-profit organization that works on digital solutions for social participation and inclusion.

## ✨ What is the a11yscore?

The a11yscore wants to answer the question: **How accessible is a city?**

It does this by analyzing millions of data points from OpenStreetMap and computing a multi-level score that covers:

| Category | Examples |
|---|---|
| 🚍 **Public Transport** | Bus stops, train stations |
| 🏥 **Health Care** | Hospitals, pharmacies |
| 🎓 **Education** | Schools, universities |
| 🏛️ **Public Institutions** | Government offices, libraries |
| 🍽️ **Food & Drinks** | Restaurants, cafés |
| 🎭 **Culture** | Museums, theaters |
| 🧑‍🤝‍🧑 **Social Care** | Social services |
| 🛤️ **Ways & Crossings** | Sidewalks, pedestrian crossings |
| 💼 **Work** | Office buildings |

Scores are broken down by **disability topics** such as wheelchair accessibility, vision, hearing and general accessibility.

### How scoring works

The algorithm uses a hierarchical, weighted scoring model:

1. **Individual places** are scored per criterion based on OSM tag values (e.g. `wheelchair=yes` → 100 points)
2. **Criteria** are averaged across all places in a region
3. **Topics** (e.g. "vision", "mobility") aggregate criteria scores with data-quality-adjusted weights
4. **Sub-categories** (e.g. "train stations") combine topic scores
5. **Categories** (e.g. "public transport") combine sub-category scores
6. **The overall a11yscore** is the weighted sum of all category scores

A built-in **data quality model** ensures that regions with sparse or inconsistent data don't produce misleading scores. Read more in the [scoring algorithm documentation](./docs/architecture/02.scoring-algorithm.md).

### Relation to the SDGs

The a11yscore maps its categories to the [UN Sustainable Development Goals](https://sdgs.un.org/goals), making it a useful metric for municipalities and policy makers tracking progress on Goal 11 (Sustainable Cities and Communities) and Goal 10 (Reduced Inequalities), among others.

## 🏗️ Architecture

The backend is a [Nitro](https://nitro.build/) server written in **TypeScript**. It connects to two PostgreSQL databases:

- **OSM Sync DB** — contains OpenStreetMap data imported via [imposm3](https://imposm.org/docs/imposm3/latest/) with the [PostGIS](https://postgis.net/) extension
- **App DB** — stores computed scores, admin areas, and application state, managed with [Drizzle ORM](https://orm.drizzle.team/)

Background jobs (score computation, admin area syncing) are managed via [BullMQ](https://docs.bullmq.io/) with [Redis](https://redis.io/) as message broker.

The [frontend](https://github.com/sozialhelden/a11yscore-frontend) is a separate React Router application using Sozialhelden's own [UI library](https://github.com/sozialhelden/ui). Translations across all projects are managed with [Transifex Native](https://transifex.com).

```
┌─────────────┐      ┌───────────────────┐      ┌──────────────────┐
│  Frontend    │◄────►│  Nitro API Server │◄────►│  App DB (PG)     │
│  (React)     │      │  + BullMQ Worker  │◄────►│  OSM Sync DB(PG) │
└─────────────┘      └────────┬──────────┘      └──────────────────┘
                              │
                        ┌─────▼─────┐
                        │   Redis   │
                        └───────────┘
```

Refer to the [architecture overview](./docs/architecture/01.overview.md) and the [architectural decision records](./docs/index.md) for more information.

## 🚀 Getting started

### Prerequisites

- [nvm](https://github.com/nvm-sh/nvm) (or any Node.js version manager)
- [Docker](https://docs.docker.com/desktop/) & [Docker Compose](https://docs.docker.com/compose/install/)
- Access to a PostgreSQL database containing OSM data (imported via imposm3)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/sozialhelden/a11yscore.git
cd a11yscore

# 2. Install the correct Node.js version and dependencies
nvm install
npm ci

# 3. Create your environment file
cp .env.example .env
# Edit .env with your database credentials

# 4. Start PostgreSQL and Redis
docker-compose up -d

# 5. Run database migrations
npm run db:migrate

# 6. Start the development server
npm run dev

# Run all tests (unit + e2e)
npm run test

# Run only unit tests (with watch mode)
npm run test:unit:watch

# Run only e2e tests
npm run test:e2e
```

The API server starts at **http://localhost:3000**. Open it in your browser to view the interactive API documentation (powered by [Scalar](https://scalar.com/)).

### Computing scores

```bash
# Sync admin areas from OSM
npm run job:sync-admin-areas

# Wait for the job to complete, then compute all scores
npm run job:compute-scores

# Or compute a single admin area by ID
npm run job:compute-admin-area-score <admin-area-id>
```

## 📖 Documentation

Comprehensive documentation lives in the [`docs/`](./docs/index.md) directory:

- [Architecture Overview](./docs/architecture/01.overview.md)
- [Scoring Algorithm](./docs/architecture/02.scoring-algorithm.md)
- [Algorithm Equations](./docs/architecture/03-algorithm-equations.md)
- [Architectural Decision Records](./docs/index.md)
- [Getting Started](./docs/development/01.getting-started.md)
- [Internationalization](./docs/development/02.internationalization.md)

## 🌐 Links

| | |
|---|---|
| 🔗 **Project homepage** | [a11yscore.org](https://a11yscore.org) |
| 🏠 **Sozialhelden e.V.** | [sozialhelden.de](https://sozialhelden.de) |
| 📦 **Frontend repo** | [github.com/sozialhelden/a11yscore-frontend](https://github.com/sozialhelden/a11yscore-frontend) |
| 🎨 **UI library** | [github.com/sozialhelden/ui](https://github.com/sozialhelden/ui) |

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

Copyright © 2026 [Sozialhelden e.V.](https://sozialhelden.de)
