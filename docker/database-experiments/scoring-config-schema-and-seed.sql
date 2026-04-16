-- =============================================================================
-- Scoring Config Schema + Seed Data
-- =============================================================================
--
-- This file creates a `scoring_config` schema with all proposed config tables
-- and seeds them with the data currently hardcoded in src/a11yscore/config/.
--
-- Usage:
--   psql -h localhost -p <port> -U <user> -d <db> -f docker/scoring-config-schema-and-seed.sql
--
-- This file is idempotent — it drops and recreates the schema on each run.
-- It does NOT touch the public schema or any existing OSM / result tables.
-- =============================================================================

BEGIN;

DROP SCHEMA IF EXISTS scoring_config CASCADE;
CREATE SCHEMA scoring_config;

-- ─── Global algorithm parameters ─────────────────────────────────────────────

CREATE TABLE scoring_config.scoring_params (
  key   TEXT PRIMARY KEY,
  value DOUBLE PRECISION NOT NULL
);

INSERT INTO scoring_config.scoring_params (key, value) VALUES
  ('min_data_quality_factor', 0.2),
  ('no_data_threshold',       0.21),
  ('topic_score_weight',      0.8),
  ('topic_dq_weight',         0.2);

-- ─── Topics ──────────────────────────────────────────────────────────────────

CREATE TABLE scoring_config.scoring_topics (
  id       TEXT PRIMARY KEY,
  name_key TEXT NOT NULL
);

INSERT INTO scoring_config.scoring_topics (id, name_key) VALUES
  ('mobility',           'Mobility'),
  ('vision',             'Vision'),
  ('hearing',            'Hearing'),
  ('toilet',             'Toilet'),
  ('neurodivergent',     'Neurodiversity'),
  ('air-and-climate',    'Air and Climate'),
  ('general-assistance', 'Helpful Amenities');

-- ─── Criteria ────────────────────────────────────────────────────────────────

CREATE TABLE scoring_config.scoring_criteria (
  id              TEXT PRIMARY KEY,
  name_key        TEXT NOT NULL,
  reason_key      TEXT,
  recommendations JSONB,
  links           JSONB
);

INSERT INTO scoring_config.scoring_criteria (id, name_key, reason_key, recommendations, links) VALUES
  -- wheelchair.ts
  ('is-wheelchair-accessible',
   'Is accessible with wheelchair',
   'Wheelchair users should be able to enter and use the most important areas of the facility without barriers and assistance.',
   '["If the entrance has one or two steps, consider getting a removable ramp.","Consider installing automatic doors or ensuring that doors can be opened without assistance.","Consider widening narrow doorways to at least 90 cm (36 inches)."]',
   '[{"label_key":"Removable ramps for wheelchair accessibility","url":"https://wheelramp.de"}]'),

  ('has-wheelchair-accessible-toilet',
   'Toilet is accessible with wheelchair',
   'Wheelchair users must be able to use the toilet.',
   '["Consider installing grab rails to existing toilets.","Consider raising the toilet seat to a comfortable height (about 48 cm)."]',
   '[{"label_key":"DIN 18040-2 Standard for Accessible Design of Buildings - Bathrooms","url":"https://nullbarriere.de/din18040-2-bad.htm"}]'),

  -- blind.ts
  ('is-accessible-to-visually-impaired',
   'Accessible to visually impaired people',
   'People with visual impairments must be able to enter and use the most important areas of the facility without barriers.',
   '["Provide tactile paving to guide visually impaired individuals to key areas such as entrances, exits, and service counters.","Install braille signage for important information, including room numbers, restrooms, and emergency exits.","Ensure that pathways are well-lit and free of obstacles to enhance safety and accessibility.","Ensure there are audible signals or announcements for important information in addition to visual ones."]',
   NULL),

  ('has-tactile-paving',
   'Tactile paving for visually impaired people',
   'People with visual impairments must be able to use tactile information to navigate.',
   '[]', NULL),

  ('has-information-board-with-speech-output',
   'Departure board with speech output for visually impaired people',
   'People with visual impairments must be able to obtain passenger information.',
   '[]', NULL),

  ('has-tactile-writing',
   'Tactile writing for visually impaired people',
   'People with visual impairments must be able to find tactile information about the facility.',
   '[]', NULL),

  -- climate.ts
  ('smoking-is-prohibited',
   'Smoke-free environment',
   'A smoke-free environment improves air quality and comfort for all visitors, but is especially necessary for people with respiratory conditions.',
   '["Restrict smoking areas to outdoor locations away from entrances."]',
   NULL),

  ('has-air-conditioning',
   'Has air conditioning',
   'Air conditioning improves indoor temperature, air quality and comfort for all visitors, but is especially important for individuals with pre-existing conditions.',
   '["Consider installing or upgrading air conditioning systems to ensure effective climate control."]',
   NULL),

  -- deaf.ts
  ('is-accessible-to-hearing-impaired',
   'Accessible to hearing impaired people',
   'Hearing impaired people must be able to access and use the most important areas of the facility without barriers.',
   '["Provide visual alarms and notifications for important information.","Consider installing hearing loops or other assistive listening devices."]',
   NULL),

  ('has-hearing-loop',
   'Has hearing (induction) loop',
   'Hearing loops (also known as induction loops) can significantly improve the listening experience for people with hearing aids or cochlear implants, allowing them to better access important information and communicate effectively.',
   '["Consider installing hearing loops or other assistive listening devices."]',
   NULL),

  -- environment.ts
  ('has-quiet-hours',
   'Has quiet hours',
   'People with neurodivergent conditions may benefit from quiet hours.',
   '["Consider implementing quiet hours during specific times of the day. Limit loud music and announcements in these hours."]',
   NULL),

  -- general.ts
  ('has-drinking-straws',
   'Drinking straws are available',
   'Drinking straws can help people with limited hand or arm mobility to drink more easily.',
   '["Consider providing drinking straws, including eco-friendly options like paper or metal straws."]',
   NULL),

  ('is-lit',
   'The facility is lit',
   'Well lit facilities improve visibility and safety for all visitors, especially those with visual impairments or mobility challenges.',
   '["Consider installing adequate lighting in and around the facility to enhance visibility and safety."]',
   NULL),

  ('has-shelter',
   'The public transport stop has shelter',
   'Shelters at public transport stops provide protection from weather conditions, enhancing comfort and safety for all passengers.',
   '["Consider providing shelters at public transport stops to protect passengers from adverse weather conditions."]',
   NULL),

  ('has-bench',
   'The public transport stop has a bench.',
   'Benches at public transport stops provide seating for passengers, enhancing comfort, especially for those with mobility issues or fatigue.',
   '["Consider providing benches at public transport stops to offer seating for waiting passengers."]',
   NULL),

  -- toilets.ts
  ('has-toilet',
   'A toilet is available',
   'A toilet should be available for all visitors, but is especially important for people with certain medical conditions e.g. inflammatory bowel disease.',
   '["Consider installing a toilet if there is none."]',
   NULL),

  -- website.ts
  ('has-website',
   'Has an official website',
   'An official website provides essential information about the facility. This can help users plan their visit and access important details.',
   '["Create an official website that includes key information such as location, opening hours, accessibility features, and contact details."]',
   NULL),

  ('has-menu-on-website',
   'Menu is available on the official website',
   'Providing the menu on the official website allows users to make informed decisions about their visit, especially for those with dietary restrictions or preferences. It also allows people with visual impairments to access the menu more easily using screen readers.',
   '["Upload the menu in an accessible format, such as HTML or PDF, to the official website."]',
   NULL),

  ('reservation-via-website',
   'Reservations can be made via the official website',
   'Online reservations improve accessibility by allowing users to easily book a visit without needing to make phone calls or visit in person.',
   '["Implement an online reservation system on the official website that is easy to navigate and use."]',
   NULL);

-- ─── Criterion scoring rules ─────────────────────────────────────────────────

CREATE TABLE scoring_config.scoring_criterion_rules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criterion_id TEXT NOT NULL REFERENCES scoring_config.scoring_criteria(id),
  tag_key      TEXT NOT NULL,
  match_type   TEXT NOT NULL DEFAULT 'exact' CHECK (match_type IN ('exact','present','any_known')),
  tag_value    TEXT,
  points       INTEGER NOT NULL,
  priority     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX ON scoring_config.scoring_criterion_rules (criterion_id, priority);

INSERT INTO scoring_config.scoring_criterion_rules (criterion_id, tag_key, match_type, tag_value, points, priority) VALUES
  -- is-wheelchair-accessible
  ('is-wheelchair-accessible', 'wheelchair', 'exact', 'yes',     100, 1),
  ('is-wheelchair-accessible', 'wheelchair', 'exact', 'limited',  50, 2),
  ('is-wheelchair-accessible', 'wheelchair', 'exact', 'no',       10, 3),
  -- has-wheelchair-accessible-toilet
  ('has-wheelchair-accessible-toilet', 'toilets:wheelchair', 'exact', 'yes', 100, 1),
  ('has-wheelchair-accessible-toilet', 'toilets:wheelchair', 'exact', 'no',   10, 2),
  -- is-accessible-to-visually-impaired
  ('is-accessible-to-visually-impaired', 'blind', 'exact',     'yes',        100, 1),
  ('is-accessible-to-visually-impaired', 'blind', 'exact',     'designated', 100, 2),
  ('is-accessible-to-visually-impaired', 'blind', 'exact',     'limited',     50, 3),
  ('is-accessible-to-visually-impaired', 'blind', 'exact',     'no',          10, 4),
  ('is-accessible-to-visually-impaired', 'blind', 'any_known', NULL,          10, 5),
  -- has-tactile-paving
  ('has-tactile-paving', 'tactile_paving', 'exact',     'yes',     100, 1),
  ('has-tactile-paving', 'tactile_paving', 'exact',     'partial',  50, 2),
  ('has-tactile-paving', 'tactile_paving', 'exact',     'no',       10, 3),
  ('has-tactile-paving', 'tactile_paving', 'any_known', NULL,       10, 4),
  -- has-information-board-with-speech-output
  ('has-information-board-with-speech-output', 'departures_board:speech_output',                  'exact',     'yes', 100, 1),
  ('has-information-board-with-speech-output', 'passenger_information_display:speech_output',     'exact',     'yes', 100, 2),
  ('has-information-board-with-speech-output', 'departures_board:speech_output',                  'exact',     'no',   10, 3),
  ('has-information-board-with-speech-output', 'passenger_information_display:speech_output',     'exact',     'no',   10, 4),
  ('has-information-board-with-speech-output', 'departures_board:speech_output',                  'any_known', NULL,   10, 5),
  ('has-information-board-with-speech-output', 'passenger_information_display:speech_output',     'any_known', NULL,   10, 6),
  -- has-tactile-writing
  ('has-tactile-writing', 'tactile_writing', 'exact',     'yes', 100, 1),
  ('has-tactile-writing', 'tactile_writing', 'exact',     'no',   10, 2),
  ('has-tactile-writing', 'tactile_writing', 'any_known', NULL,   10, 3),
  -- smoking-is-prohibited
  ('smoking-is-prohibited', 'smoking', 'exact',     'no',        100, 1),
  ('smoking-is-prohibited', 'smoking', 'exact',     'isolated',   90, 2),
  ('smoking-is-prohibited', 'smoking', 'exact',     'separated',  80, 3),
  ('smoking-is-prohibited', 'smoking', 'exact',     'yes',        10, 4),
  ('smoking-is-prohibited', 'smoking', 'exact',     'dedicated',  10, 5),
  ('smoking-is-prohibited', 'smoking', 'any_known', NULL,         10, 6),
  -- has-air-conditioning
  ('has-air-conditioning', 'air_conditioning', 'exact',     'yes', 100, 1),
  ('has-air-conditioning', 'air_conditioning', 'exact',     'no',   10, 2),
  ('has-air-conditioning', 'air_conditioning', 'any_known', NULL,   10, 3),
  -- is-accessible-to-hearing-impaired
  ('is-accessible-to-hearing-impaired', 'deaf', 'exact',     'yes',        100, 1),
  ('is-accessible-to-hearing-impaired', 'deaf', 'exact',     'designated', 100, 2),
  ('is-accessible-to-hearing-impaired', 'deaf', 'exact',     'limited',     50, 3),
  ('is-accessible-to-hearing-impaired', 'deaf', 'exact',     'no',          10, 4),
  ('is-accessible-to-hearing-impaired', 'deaf', 'any_known', NULL,          10, 5),
  -- has-hearing-loop
  ('has-hearing-loop', 'hearing_loop', 'exact', 'yes', 100, 1),
  ('has-hearing-loop', 'audio_loop',   'exact', 'yes', 100, 2),
  ('has-hearing-loop', 'hearing_loop', 'exact', 'no',   10, 3),
  ('has-hearing-loop', 'audio_loop',   'exact', 'no',   10, 4),
  -- has-quiet-hours
  ('has-quiet-hours', 'quiet_hours', 'present', NULL, 100, 1),
  -- has-drinking-straws
  ('has-drinking-straws', 'drinking_straw', 'exact',     'yes',        100, 1),
  ('has-drinking-straws', 'drinking_straw', 'exact',     'plastic',    100, 2),
  ('has-drinking-straws', 'drinking_straw', 'exact',     'paper',      100, 3),
  ('has-drinking-straws', 'drinking_straw', 'exact',     'bioplastic', 100, 4),
  ('has-drinking-straws', 'drinking_straw', 'exact',     'metal',      100, 5),
  ('has-drinking-straws', 'drinking_straw', 'exact',     'no',          10, 6),
  ('has-drinking-straws', 'drinking_straw', 'any_known', NULL,          10, 7),
  -- is-lit
  ('is-lit', 'lit', 'exact',     'yes', 100, 1),
  ('is-lit', 'lit', 'exact',     'no',   10, 2),
  ('is-lit', 'lit', 'any_known', NULL,   10, 3),
  -- has-shelter
  ('has-shelter', 'shelter', 'exact',     'yes',     100, 1),
  ('has-shelter', 'shelter', 'exact',     'roof',    100, 2),
  ('has-shelter', 'covered', 'exact',     'yes',     100, 3),
  ('has-shelter', 'shelter', 'exact',     'limited',  50, 4),
  ('has-shelter', 'shelter', 'exact',     'no',       10, 5),
  ('has-shelter', 'covered', 'exact',     'no',       10, 6),
  ('has-shelter', 'shelter', 'any_known', NULL,       10, 7),
  ('has-shelter', 'covered', 'any_known', NULL,       10, 8),
  -- has-bench
  ('has-bench', 'bench', 'exact',     'yes',            100, 1),
  ('has-bench', 'bench', 'exact',     'stand_up_bench',  50, 2),
  ('has-bench', 'bench', 'exact',     'no',              10, 3),
  ('has-bench', 'bench', 'any_known', NULL,              10, 4),
  -- has-toilet
  ('has-toilet', 'toilets', 'exact',     'yes', 100, 1),
  ('has-toilet', 'toilets', 'exact',     'no',   10, 2),
  ('has-toilet', 'toilets', 'any_known', NULL,   10, 3),
  -- has-website
  ('has-website', 'contact:website', 'present', NULL, 100, 1),
  ('has-website', 'website',         'present', NULL, 100, 2),
  -- has-menu-on-website
  ('has-menu-on-website', 'website:menu', 'present', NULL, 100, 1),
  -- reservation-via-website
  ('reservation-via-website', 'reservation:website', 'present', NULL, 100, 1);

-- ─── Criterion data-quality tags ─────────────────────────────────────────────

CREATE TABLE scoring_config.scoring_criterion_dq_tags (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criterion_id TEXT NOT NULL REFERENCES scoring_config.scoring_criteria(id),
  tag_key      TEXT NOT NULL,
  tag_value    TEXT NOT NULL,
  UNIQUE (criterion_id, tag_key, tag_value)
);

INSERT INTO scoring_config.scoring_criterion_dq_tags (criterion_id, tag_key, tag_value) VALUES
  ('is-wheelchair-accessible',       'wheelchair', 'yes'),
  ('is-wheelchair-accessible',       'wheelchair', 'limited'),
  ('is-wheelchair-accessible',       'wheelchair', 'no'),
  ('has-wheelchair-accessible-toilet','toilets:wheelchair', 'yes'),
  ('has-wheelchair-accessible-toilet','toilets:wheelchair', 'no'),
  ('is-accessible-to-visually-impaired', 'blind', 'yes'),
  ('is-accessible-to-visually-impaired', 'blind', 'designated'),
  ('is-accessible-to-visually-impaired', 'blind', 'limited'),
  ('is-accessible-to-visually-impaired', 'blind', 'no'),
  ('has-tactile-paving', 'tactile_paving', 'yes'),
  ('has-tactile-paving', 'tactile_paving', 'partial'),
  ('has-tactile-paving', 'tactile_paving', 'no'),
  ('has-information-board-with-speech-output', 'departures_board:speech_output', 'yes'),
  ('has-information-board-with-speech-output', 'departures_board:speech_output', 'no'),
  ('has-information-board-with-speech-output', 'passenger_information_display:speech_output', 'yes'),
  ('has-information-board-with-speech-output', 'passenger_information_display:speech_output', 'no'),
  ('has-tactile-writing', 'tactile_writing', 'yes'),
  ('has-tactile-writing', 'tactile_writing', 'no'),
  ('smoking-is-prohibited', 'smoking', 'no'),
  ('smoking-is-prohibited', 'smoking', 'isolated'),
  ('smoking-is-prohibited', 'smoking', 'separated'),
  ('smoking-is-prohibited', 'smoking', 'yes'),
  ('smoking-is-prohibited', 'smoking', 'dedicated'),
  ('has-air-conditioning', 'air_conditioning', 'yes'),
  ('has-air-conditioning', 'air_conditioning', 'no'),
  ('is-accessible-to-hearing-impaired', 'deaf', 'yes'),
  ('is-accessible-to-hearing-impaired', 'deaf', 'designated'),
  ('is-accessible-to-hearing-impaired', 'deaf', 'limited'),
  ('is-accessible-to-hearing-impaired', 'deaf', 'no'),
  ('has-hearing-loop', 'hearing_loop', 'yes'),
  ('has-hearing-loop', 'audio_loop',   'yes'),
  ('has-hearing-loop', 'hearing_loop', 'no'),
  ('has-hearing-loop', 'audio_loop',   'no'),
  ('has-quiet-hours', 'quiet_hours', '*'),
  ('has-drinking-straws', 'drinking_straw', 'yes'),
  ('has-drinking-straws', 'drinking_straw', 'no'),
  ('has-drinking-straws', 'drinking_straw', 'plastic'),
  ('has-drinking-straws', 'drinking_straw', 'paper'),
  ('has-drinking-straws', 'drinking_straw', 'bioplastic'),
  ('has-drinking-straws', 'drinking_straw', 'metal'),
  ('is-lit', 'lit', 'yes'),
  ('is-lit', 'lit', 'no'),
  ('has-shelter', 'shelter', 'yes'),
  ('has-shelter', 'shelter', 'roof'),
  ('has-shelter', 'shelter', 'limited'),
  ('has-shelter', 'shelter', 'no'),
  ('has-shelter', 'covered', 'yes'),
  ('has-shelter', 'covered', 'no'),
  ('has-bench', 'bench', 'yes'),
  ('has-bench', 'bench', 'stand_up_bench'),
  ('has-bench', 'bench', 'no'),
  ('has-toilet', 'toilets', 'yes'),
  ('has-toilet', 'toilets', 'no'),
  ('has-website', 'contact:website', '*'),
  ('has-website', 'website', '*'),
  ('has-menu-on-website', 'website:menu', '*'),
  ('reservation-via-website', 'reservation:website', '*');

-- ─── Top-level categories ────────────────────────────────────────────────────

CREATE TABLE scoring_config.scoring_top_level_categories (
  id              TEXT PRIMARY KEY,
  name_key        TEXT NOT NULL,
  description_key TEXT,
  weight          DOUBLE PRECISION NOT NULL DEFAULT 0,
  planned         BOOLEAN NOT NULL DEFAULT false,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  sdgs            JSONB
);

INSERT INTO scoring_config.scoring_top_level_categories (id, name_key, description_key, weight, planned, sort_order, sdgs) VALUES
  ('food-and-drinks',     'Food and Drinks',     'This category includes various dining and shopping venues, including restaurants, cafes, bakeries, and food stores, as well as access to public drinking water.', 0.1,  false, 1, '[2,12,13,14]'),
  ('health-care',         'Health Care',         'This category includes medical services and facilities, including hospitals, doctors'' offices, pharmacies, clinics, and specialized therapy or counselling centers.', 0.18, false, 2, '[3,10,5]'),
  ('public-transport',    'Public Transport',    'This category includes transit hubs and boarding points, including platforms and stations for buses, trains, trams, subways, light rail, and ferries.', 0.18, false, 3, '[9,13,15,16]'),
  ('social-care',         'Social Care',         'This category includes essential support services, including community centers, counselling, shelters, and facilities for seniors, youth, and people with disabilities.', 0.18, false, 4, '[1,2,3,5,10,11,16]'),
  ('education',           'Education',           'This category will evaluate the accessibility of educational facilities, including schools, universities, and libraries.', 0.18, false, 5, '[4,5,8,9,10,11,17]'),
  ('public-institutions', 'Public Institutions', 'This category evaluates the accessibility of public institutions, including townhalls, government offices, police stations, courts and consulates.', 0.18, false, 6, '[8,5,10,11,16,17]'),
  ('culture',             'Culture',             'This category will evaluate the accessibility of cultural amenities, including theaters, opera houses, museums and cinemas.', 0, true, 7, '[3,4,10]'),
  ('work',                'Work',                'This category will evaluate the accessibility of work places, including office buildings, company offices, manufacturers and factories.', 0, true, 8, '[1,3,4,10,9]'),
  ('ways-crossings',      'Ways and Crossings',  'This category will evaluate the accessibility of ways and crossings, including pavement surfaces, curb heights, intersections and crossings and traffic lights.', 0, true, 9, '[3,4,10]');

-- ─── Sub-categories ──────────────────────────────────────────────────────────

CREATE TABLE scoring_config.scoring_sub_categories (
  id                    TEXT PRIMARY KEY,
  top_level_category_id TEXT NOT NULL REFERENCES scoring_config.scoring_top_level_categories(id),
  name_key              TEXT NOT NULL,
  description_key       TEXT,
  weight                DOUBLE PRECISION NOT NULL,
  osm_source_table      TEXT NOT NULL
);

INSERT INTO scoring_config.scoring_sub_categories (id, top_level_category_id, name_key, description_key, weight, osm_source_table) VALUES
  -- food-and-drinks
  ('drinking-water',  'food-and-drinks', 'Drinking water',    'Includes drinking water fountains, springs, water stores and public taps', 0.1,  'osm_amenities'),
  ('bars',            'food-and-drinks', 'Bars and pubs',     NULL, 0.05, 'osm_amenities'),
  ('food-stores',     'food-and-drinks', 'Food stores',       'Includes butcher shops, cheese stores, dairy stores, chocolate shops, coffee shops, delis, farm stores, general food shops, greengrocers, health food stores, pasta shops, seafood markets, spice shops, tea shops, nut stores, tortilla shops, wine shops and liquor stores', 0.1,  'osm_amenities'),
  ('ice-cream',       'food-and-drinks', 'Ice cream shops',   NULL, 0.05, 'osm_amenities'),
  ('bakeries',        'food-and-drinks', 'Bakeries',          NULL, 0.1,  'osm_amenities'),
  ('restaurants',     'food-and-drinks', 'Restaurants',       NULL, 0.2,  'osm_amenities'),
  ('cafes',           'food-and-drinks', 'Cafes',             NULL, 0.1,  'osm_amenities'),
  ('fast-food',       'food-and-drinks', 'Fast food',         NULL, 0.1,  'osm_amenities'),
  ('canteen',         'food-and-drinks', 'Canteen',           NULL, 0.1,  'osm_amenities'),
  ('food-court',      'food-and-drinks', 'Food court',        NULL, 0.1,  'osm_amenities'),
  -- health-care  (weight = 1/9 ≈ 0.111111)
  ('health-counselling',      'health-care', 'Health Counselling',                              'Includes facilities providing health counselling services such as dietitians, nutritionists, sexual health counselling, antenatal counselling, and psychiatric services.', 0.111111, 'osm_amenities'),
  ('doctors',                 'health-care', 'Doctors and Medical Practices',                   'Includes all types of doctors'' offices, medical practices, dental clinics, veterinarians, audiologists, nurses, optometrists, and podiatrists.', 0.111111, 'osm_amenities'),
  ('hospitals',               'health-care', 'Hospitals',                                       'Public or private hospitals providing full medical care and in-patient facilities.', 0.111111, 'osm_amenities'),
  ('clinics',                 'health-care', 'Clinics and Outpatient Centers',                  'Includes walk-in clinics, medical centres (including MVZs), outpatient care, and specialty clinics.', 0.111111, 'osm_amenities'),
  ('pharmacies',              'health-care', 'Pharmacies',                                      'Includes pharmacies and dispensaries, where prescription and over-the-counter medicines are sold.', 0.111111, 'osm_amenities'),
  ('therapists',              'health-care', 'Therapy and Alternative Medicine Centers',        'Facilities for physical therapy, occupational therapy, speech therapy, physiotherapy, and practices in alternative medicine.', 0.111111, 'osm_amenities'),
  ('psycho-therapists',       'health-care', 'Psychotherapy Practices',                         'Offices and centers where psychotherapists offer mental health counseling and support.', 0.111111, 'osm_amenities'),
  ('other-health-facilities', 'health-care', 'Other Health Facilities',                         'Includes health posts, blood donation centers, dialysis centers, hospices, midwife care, rehabilitation, sample collection sites, vaccination centers, birthing centers, and postpartum recovery facilities.', 0.111111, 'osm_amenities'),
  ('health-shops',            'health-care', 'Medical Supply & Specialized Health Shops',       'Shops or stores specializing in medical supplies, visual aids, hearing aids, dentures, and herbal medicine products.', 0.111111, 'osm_amenities'),
  -- public-transport  (weight = 1/12 ≈ 0.083333)
  ('bus-platforms',        'public-transport', 'Bus Platforms',        'Includes bus platforms, the places where passengers board or alight from buses.', 0.083333, 'osm_platforms'),
  ('tram-platforms',       'public-transport', 'Tram Platforms',       'Includes tram platforms, the places where passengers board or alight from trams.', 0.083333, 'osm_platforms'),
  ('subway-platforms',     'public-transport', 'Subway Platforms',     'Includes subway platforms, the places where passengers board or alight from subways cars.', 0.083333, 'osm_platforms'),
  ('train-platforms',      'public-transport', 'Train platforms',      'Includes train platforms, the places where passengers board or alight from trains.', 0.083333, 'osm_platforms'),
  ('ferry-platforms',      'public-transport', 'Ferry platforms',      'Includes ferry platforms, the places where passengers board or alight from ferries.', 0.083333, 'osm_platforms'),
  ('light-rail-platforms', 'public-transport', 'Light Rail platforms', 'Includes light rail platforms, the places where passengers board or alight from light rail trains.', 0.083333, 'osm_platforms'),
  ('bus-stations',         'public-transport', 'Bus stations',         'Bus stations are larger transport hubs where passengers can board or alight from buses, often featuring multiple platforms and additional amenities.', 0.083333, 'osm_stations'),
  ('tram-stations',        'public-transport', 'Tram stations',        'Tram stations are larger transport hubs where passengers can board or alight from trams, often featuring multiple platforms and additional amenities.', 0.083333, 'osm_stations'),
  ('subway-stations',      'public-transport', 'Subway stations',      'Subway stations are larger transport hubs where passengers can board or alight from subway cars, often featuring multiple platforms and additional amenities.', 0.083333, 'osm_stations'),
  ('train-stations',       'public-transport', 'Train stations',       'Train stations are larger transport hubs where passengers can board or alight from trains, often featuring multiple platforms and additional amenities.', 0.083333, 'osm_stations'),
  ('ferry-stations',       'public-transport', 'Ferry stations',       'Ferry stations are larger transport hubs where passengers can board or alight from ferries, often featuring multiple platforms and additional amenities.', 0.083333, 'osm_stations'),
  ('light-rail-stations',  'public-transport', 'Light Rail stations',  'Light rail stations are larger transport hubs where passengers can board or alight from light rail, often featuring multiple platforms and additional amenities.', 0.083333, 'osm_stations'),
  -- social-care  (weight = 1/13 ≈ 0.076923)
  ('community-centers',       'social-care', 'Community Centers',                           'Includes community centers and social centers.', 0.076923, 'osm_amenities'),
  ('counselling-services',    'social-care', 'Counselling Services and Social Support',     'Includes non-medical counselling such as family and addiction counselling.', 0.076923, 'osm_amenities'),
  ('ambulatory-services',     'social-care', 'Ambulatory Service Offices',                  'Includes offices providing ambulatory social services and mobile care.', 0.076923, 'osm_amenities'),
  ('senior-facilities',       'social-care', 'Senior Facilities',                           'Includes facilities for seniors such as residential groups, nursing homes, assisted living, and day care.', 0.076923, 'osm_amenities'),
  ('child-youth-facilities',  'social-care', 'Child and Youth Facilities',                  'Includes facilities for children and youth such as residential groups, orphanages, shelters, and social work organizations.', 0.076923, 'osm_amenities'),
  ('disabled-facilities',     'social-care', 'Facilities for People with Disabilities',     'Includes facilities for people with disabilities such as residential groups, nursing homes, assisted living, day care, and workshops for people with disabilities.', 0.076923, 'osm_amenities'),
  ('refugee-accommodations',  'social-care', 'Accommodations for Refugees and Migrants',    'Includes shelters and accommodations for refugees and immigrants.', 0.076923, 'osm_amenities'),
  ('women-mother-shelters',   'social-care', 'Shelters for Women and Mothers',              'Includes shelters and accommodations for women, mothers, and their children.', 0.076923, 'osm_amenities'),
  ('queer-facilities',        'social-care', 'Facilities for Queer People',                 'Includes facilities and services specifically for queer people, such as LGBTQ+ communities.', 0.076923, 'osm_amenities'),
  ('addiction-facilities',    'social-care', 'Facilities for People with Addiction Problems','Includes facilities for people with addiction issues, such as addiction counseling, rehabilitation, and support centers.', 0.076923, 'osm_amenities'),
  ('clothing-banks',          'social-care', 'Clothing Banks',                               'Includes clothing banks where people in need can receive free or low-cost clothing.', 0.076923, 'osm_amenities'),
  ('charity-shops',           'social-care', 'Charity Shops',                                'Includes charity shops offering affordable clothing, household goods, and other items.', 0.076923, 'osm_amenities'),
  ('soup-kitchens-food-banks','social-care', 'Food Banks and Soup Kitchens',                 'Includes soup kitchens and food banks providing meals or food support to people in need.', 0.076923, 'osm_amenities'),
  -- education  (weight = 1/5 = 0.2)
  ('kindergartens',     'education', 'Kindergartens',              'Includes kindergartens, childcare facilities and preschools. These are educational facilities for young children, typically between the ages of 3 and 6.', 0.2, 'osm_amenities'),
  ('schools',           'education', 'Schools',                    'Includes primary and secondary schools, which provide education for children and teenagers typically between the ages of 6 and 18.', 0.2, 'osm_amenities'),
  ('higher-education',  'education', 'Higher Education',           'Includes universities, colleges and other higher education institutions like police academies that provide education and research opportunities for students typically aged 18 and above.', 0.2, 'osm_amenities'),
  ('other-education',   'education', 'Other Educaton Facilities',  'Includes specialized education facilities such as language schools, music schools, dance schools, cooking schools, libraries, research institutes, and other vocational or specialized education providers.', 0.2, 'osm_amenities'),
  ('driving-schools',   'education', 'Driving Schools',            'Includes driving schools.', 0.2, 'osm_amenities'),
  -- public-institutions  (weight = 1/5 = 0.2)
  ('townhalls',              'public-institutions', 'Townhalls',                'Townhalls are the administrative centers of municipalities. They provide various public services and administrative functions.', 0.2, 'osm_amenities'),
  ('consulates-embassies',   'public-institutions', 'Consulates and Embassies', 'Consulates and embassies represent foreign governments and provide services to their citizens and conduct diplomatic relations.', 0.2, 'osm_amenities'),
  ('police-stations',        'public-institutions', 'Police Stations',          'Police stations are facilities where law enforcement officers work and provide public safety services and support.', 0.2, 'osm_amenities'),
  ('courts',                 'public-institutions', 'Courts',                   'Courts are judicial facilities where legal proceedings take place and justice is administered.', 0.2, 'osm_amenities'),
  ('government-offices',     'public-institutions', 'Government Offices',       'Government offices include tax authorities, citizen offices, immigration offices, parliaments and other administrative institutions providing public services.', 0.2, 'osm_amenities');

-- ─── Sub-category selectors ──────────────────────────────────────────────────

CREATE TABLE scoring_config.scoring_sub_category_selectors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_category_id TEXT NOT NULL REFERENCES scoring_config.scoring_sub_categories(id),
  filter_group    INTEGER NOT NULL DEFAULT 0,
  column_ref      TEXT NOT NULL,
  operator        TEXT NOT NULL DEFAULT '=' CHECK (operator IN ('=','!=')),
  value           TEXT NOT NULL
);

INSERT INTO scoring_config.scoring_sub_category_selectors (sub_category_id, filter_group, column_ref, operator, value) VALUES
  -- food-and-drinks
  ('drinking-water', 0, 'shop',                '=', 'water'),
  ('drinking-water', 1, 'tags:fountain',       '=', 'drinking'),
  ('drinking-water', 2, 'amenity',             '=', 'water_point'),
  ('drinking-water', 3, 'amenity',             '=', 'drinking_water'),
  ('drinking-water', 4, 'tags:drinking_water', '=', 'yes'),
  ('bars', 0, 'amenity',   '=', 'bar'),
  ('bars', 1, 'amenity',   '=', 'pub'),
  ('bars', 2, 'tags:bar',  '=', 'yes'),
  ('food-stores',  0, 'shop', '=', 'butcher'),
  ('food-stores',  1, 'shop', '=', 'cheese'),
  ('food-stores',  2, 'shop', '=', 'dairy'),
  ('food-stores',  3, 'shop', '=', 'chocolate'),
  ('food-stores',  4, 'shop', '=', 'coffee'),
  ('food-stores',  5, 'shop', '=', 'deli'),
  ('food-stores',  6, 'shop', '=', 'farm'),
  ('food-stores',  7, 'shop', '=', 'food'),
  ('food-stores',  8, 'shop', '=', 'greengrocer'),
  ('food-stores',  9, 'shop', '=', 'health_food'),
  ('food-stores', 10, 'shop', '=', 'pasta'),
  ('food-stores', 11, 'shop', '=', 'seafood'),
  ('food-stores', 12, 'shop', '=', 'spices'),
  ('food-stores', 13, 'shop', '=', 'tea'),
  ('food-stores', 14, 'shop', '=', 'nuts'),
  ('food-stores', 15, 'shop', '=', 'tortillas'),
  ('food-stores', 16, 'shop', '=', 'wine'),
  ('food-stores', 17, 'shop', '=', 'alcohol'),
  ('ice-cream', 0, 'shop',    '=', 'ice_cream'),
  ('ice-cream', 1, 'amenity', '=', 'ice_cream'),
  ('bakeries', 0, 'shop', '=', 'bakery'),
  ('bakeries', 1, 'shop', '=', 'confectionery'),
  ('bakeries', 2, 'shop', '=', 'pastry'),
  ('restaurants', 0, 'amenity', '=', 'restaurant'),
  ('cafes',      0, 'amenity', '=', 'cafe'),
  ('fast-food',  0, 'amenity',        '=',  'fast_food'),
  ('fast-food',  0, 'tags:fast_food', '!=', 'cafeteria'),
  ('canteen',    0, 'amenity',        '=',  'canteen'),
  ('canteen',    1, 'amenity',        '=',  'fast_food'),
  ('canteen',    1, 'tags:fast_food', '=',  'cafeteria'),
  ('food-court', 0, 'amenity', '=', 'food_court'),

  -- health-care
  ('health-counselling', 0, 'tags:healthcare:counselling', '=', 'dietitian'),
  ('health-counselling', 1, 'tags:healthcare:counselling', '=', 'nutrition'),
  ('health-counselling', 2, 'tags:healthcare:counselling', '=', 'sexual'),
  ('health-counselling', 3, 'tags:healthcare:counselling', '=', 'antenatal'),
  ('health-counselling', 4, 'tags:healthcare:counselling', '=', 'psychiatry'),
  ('doctors', 0, 'amenity',    '=', 'doctors'),
  ('doctors', 1, 'amenity',    '=', 'dentist'),
  ('doctors', 2, 'amenity',    '=', 'veterinary'),
  ('doctors', 3, 'healthcare', '=', 'doctor'),
  ('doctors', 4, 'healthcare', '=', 'dentist'),
  ('doctors', 5, 'healthcare', '=', 'audiologist'),
  ('doctors', 6, 'healthcare', '=', 'nurse'),
  ('doctors', 7, 'healthcare', '=', 'optometrist'),
  ('doctors', 8, 'healthcare', '=', 'podiatrist'),
  ('hospitals', 0, 'amenity',    '=', 'hospital'),
  ('hospitals', 1, 'healthcare', '=', 'hospital'),
  ('clinics',   0, 'amenity',    '=', 'clinic'),
  ('clinics',   1, 'healthcare', '=', 'clinic'),
  ('pharmacies', 0, 'amenity', '=', 'pharmacy'),
  ('therapists', 0, 'healthcare', '=', 'alternative'),
  ('therapists', 1, 'healthcare', '=', 'occupational_therapist'),
  ('therapists', 2, 'healthcare', '=', 'speech_therapist'),
  ('therapists', 3, 'healthcare', '=', 'physiotherapist'),
  ('psycho-therapists', 0, 'healthcare', '=', 'psychotherapist'),
  ('other-health-facilities', 0, 'amenity',    '=', 'health_post'),
  ('other-health-facilities', 1, 'healthcare', '=', 'blood_donation'),
  ('other-health-facilities', 2, 'healthcare', '=', 'dialysis'),
  ('other-health-facilities', 3, 'healthcare', '=', 'hospice'),
  ('other-health-facilities', 4, 'healthcare', '=', 'midwife'),
  ('other-health-facilities', 5, 'healthcare', '=', 'rehabilitation'),
  ('other-health-facilities', 6, 'healthcare', '=', 'sample_collection'),
  ('other-health-facilities', 7, 'healthcare', '=', 'vaccination_centre'),
  ('other-health-facilities', 8, 'healthcare', '=', 'birthing_centre'),
  ('other-health-facilities', 9, 'healthcare', '=', 'postpartum_care'),
  ('health-shops', 0, 'shop',    '=', 'medical_supply'),
  ('health-shops', 1, 'shop',    '=', 'optician'),
  ('health-shops', 2, 'shop',    '=', 'dentures'),
  ('health-shops', 3, 'shop',    '=', 'herbalist'),
  ('health-shops', 4, 'amenity', '=', 'hearing_aids'),

  -- public-transport (platforms)
  ('bus-platforms',        0, 'public_transport', '=', 'platform'),
  ('bus-platforms',        0, 'bus',              '=', 'yes'),
  ('tram-platforms',       0, 'public_transport', '=', 'platform'),
  ('tram-platforms',       0, 'tram',             '=', 'yes'),
  ('subway-platforms',     0, 'public_transport', '=', 'platform'),
  ('subway-platforms',     0, 'subway',           '=', 'yes'),
  ('train-platforms',      0, 'public_transport', '=', 'platform'),
  ('train-platforms',      0, 'train',            '=', 'yes'),
  ('ferry-platforms',      0, 'public_transport', '=', 'platform'),
  ('ferry-platforms',      0, 'ferry',            '=', 'yes'),
  ('light-rail-platforms', 0, 'public_transport', '=', 'platform'),
  ('light-rail-platforms', 0, 'light_rail',       '=', 'yes'),
  -- public-transport (stations)
  ('bus-stations',         0, 'public_transport', '=', 'station'),
  ('bus-stations',         0, 'bus',              '=', 'yes'),
  ('tram-stations',        0, 'public_transport', '=', 'station'),
  ('tram-stations',        0, 'tram',             '=', 'yes'),
  ('subway-stations',      0, 'public_transport', '=', 'station'),
  ('subway-stations',      0, 'subway',           '=', 'yes'),
  ('train-stations',       0, 'public_transport', '=', 'station'),
  ('train-stations',       0, 'train',            '=', 'yes'),
  ('ferry-stations',       0, 'public_transport', '=', 'station'),
  ('ferry-stations',       0, 'ferry',            '=', 'yes'),
  ('light-rail-stations',  0, 'public_transport', '=', 'station'),
  ('light-rail-stations',  0, 'light_rail',       '=', 'yes'),

  -- social-care
  ('community-centers', 0, 'amenity',                  '=', 'community_centre'),
  ('community-centers', 1, 'amenity',                  '=', 'social_centre'),
  ('community-centers', 2, 'tags:social_facility:for', '=', 'community'),
  ('counselling-services', 0, 'tags:healthcare',              '=', 'counselling'),
  ('counselling-services', 1, 'tags:healthcare:counselling',  '=', 'addiction'),
  ('counselling-services', 2, 'tags:healthcare:counselling',  '=', 'family'),
  ('counselling-services', 3, 'tags:social_facility:for',     '=', 'family'),
  ('ambulatory-services',    0, 'tags:social_facility',     '=', 'ambulatory_care'),
  ('senior-facilities',      0, 'tags:social_facility:for', '=', 'senior'),
  ('child-youth-facilities', 0, 'tags:social_facility:for', '=', 'juvenile'),
  ('child-youth-facilities', 1, 'tags:social_facility:for', '=', 'child;juvenile'),
  ('child-youth-facilities', 2, 'tags:social_facility:for', '=', 'child'),
  ('child-youth-facilities', 3, 'tags:social_facility:for', '=', 'children'),
  ('child-youth-facilities', 4, 'tags:social_facility:for', '=', 'youth'),
  ('child-youth-facilities', 5, 'tags:social_facility:for', '=', 'orphan'),
  ('disabled-facilities', 0, 'tags:social_facility:for', '=', 'disabled'),
  ('disabled-facilities', 1, 'tags:social_facility:for', '=', 'mental_health'),
  -- refugee-accommodations (AND-of-OR converted to DNF)
  ('refugee-accommodations', 0, 'tags:social_facility',     '=', 'shelter'),
  ('refugee-accommodations', 0, 'tags:social_facility:for', '=', 'refugees'),
  ('refugee-accommodations', 1, 'tags:social_facility',     '=', 'shelter'),
  ('refugee-accommodations', 1, 'tags:social_facility:for', '=', 'refugee'),
  ('refugee-accommodations', 2, 'tags:social_facility',     '=', 'shelter'),
  ('refugee-accommodations', 2, 'tags:social_facility:for', '=', 'migrant'),
  ('refugee-accommodations', 3, 'tags:social_facility',     '=', 'shelter'),
  ('refugee-accommodations', 3, 'tags:social_facility:for', '=', 'migrants'),
  ('refugee-accommodations', 4, 'tags:social_facility',     '=', 'shelter'),
  ('refugee-accommodations', 4, 'tags:social_facility:for', '=', 'refugees, migrants'),
  ('refugee-accommodations', 5, 'tags:social_facility',     '=', 'shelter'),
  ('refugee-accommodations', 5, 'tags:social_facility:for', '=', 'refugees,migrants,immigrants'),
  ('refugee-accommodations', 6, 'tags:social_facility',     '=', 'shelter'),
  ('refugee-accommodations', 6, 'tags:social_facility:for', '=', 'migrants;refugees'),
  ('refugee-accommodations', 7, 'tags:social_facility',     '=', 'shelter'),
  ('refugee-accommodations', 7, 'tags:social_facility:for', '=', 'displaced'),
  -- women-mother-shelters (AND-of-OR converted to DNF)
  ('women-mother-shelters', 0, 'tags:social_facility',     '=', 'shelter'),
  ('women-mother-shelters', 0, 'tags:social_facility:for', '=', 'Women'),
  ('women-mother-shelters', 1, 'tags:social_facility',     '=', 'shelter'),
  ('women-mother-shelters', 1, 'tags:social_facility:for', '=', 'women'),
  ('women-mother-shelters', 2, 'tags:social_facility',     '=', 'shelter'),
  ('women-mother-shelters', 2, 'tags:social_facility:for', '=', 'woman'),
  ('women-mother-shelters', 3, 'tags:social_facility',     '=', 'shelter'),
  ('women-mother-shelters', 3, 'tags:social_facility:for', '=', 'woman;child'),
  ('women-mother-shelters', 4, 'tags:social_facility',     '=', 'shelter'),
  ('women-mother-shelters', 4, 'tags:social_facility:for', '=', 'child;woman'),
  ('women-mother-shelters', 5, 'tags:social_facility',     '=', 'shelter'),
  ('women-mother-shelters', 5, 'tags:social_facility:for', '=', 'child;women'),
  ('women-mother-shelters', 6, 'tags:social_facility',     '=', 'shelter'),
  ('women-mother-shelters', 6, 'tags:social_facility:for', '=', 'women;child'),
  ('women-mother-shelters', 7, 'tags:social_facility',     '=', 'shelter'),
  ('women-mother-shelters', 7, 'tags:social_facility:for', '=', 'women;children'),
  ('queer-facilities',       0, 'tags:social_facility:for', '=', 'lgbtq'),
  ('addiction-facilities',   0, 'tags:social_facility:for', '=', 'drug_addicted'),
  ('clothing-banks',         0, 'tags:social_facility',     '=', 'clothing_bank'),
  ('charity-shops',          0, 'tags:shop',                '=', 'charity'),
  ('soup-kitchens-food-banks', 0, 'tags:social_facility',   '=', 'soup_kitchen'),
  ('soup-kitchens-food-banks', 1, 'tags:social_facility',   '=', 'food_bank'),

  -- education
  ('kindergartens', 0, 'tags:education', '=', 'kindergarten'),
  ('kindergartens', 1, 'amenity',        '=', 'kindergarten'),
  ('kindergartens', 2, 'amenity',        '=', 'childcare'),
  -- schools (DNF of: (amenity=school OR tags:education=school) AND tags:college != adult_education)
  ('schools', 0, 'amenity',       '=',  'school'),
  ('schools', 0, 'tags:college',  '!=', 'adult_education'),
  ('schools', 1, 'tags:education','=',  'school'),
  ('schools', 1, 'tags:college',  '!=', 'adult_education'),
  -- higher-education (DNF)
  ('higher-education', 0, 'amenity',        '=',  'university'),
  ('higher-education', 0, 'tags:college',   '!=', 'adult_education'),
  ('higher-education', 1, 'amenity',        '=',  'college'),
  ('higher-education', 1, 'tags:college',   '!=', 'adult_education'),
  ('higher-education', 2, 'tags:education', '=',  'university'),
  ('higher-education', 2, 'tags:college',   '!=', 'adult_education'),
  ('higher-education', 3, 'tags:education', '=',  'college'),
  ('higher-education', 3, 'tags:college',   '!=', 'adult_education'),
  ('higher-education', 4, 'tags:police',    '=',  'academy'),
  ('higher-education', 4, 'tags:college',   '!=', 'adult_education'),
  -- other-education
  ('other-education',  0, 'tags:college',    '=', 'adult_education'),
  ('other-education',  1, 'tags:education',  '=', 'language_school'),
  ('other-education',  2, 'tags:education',  '=', 'music_school'),
  ('other-education',  3, 'tags:education',  '=', 'prep_school'),
  ('other-education',  4, 'tags:education',  '=', 'facultative_school'),
  ('other-education',  5, 'tags:education',  '=', 'dancing_school'),
  ('other-education',  6, 'tags:education',  '=', 'cooking_school'),
  ('other-education',  7, 'tags:education',  '=', 'ski_school'),
  ('other-education',  8, 'tags:education',  '=', 'sailing_school'),
  ('other-education',  9, 'tags:education',  '=', 'art_school'),
  ('other-education', 10, 'amenity',         '=', 'dancing_school'),
  ('other-education', 11, 'amenity',         '=', 'first_aid_school'),
  ('other-education', 12, 'amenity',         '=', 'language_school'),
  ('other-education', 13, 'amenity',         '=', 'library'),
  ('other-education', 14, 'amenity',         '=', 'surf_school'),
  ('other-education', 15, 'amenity',         '=', 'research_institute'),
  ('other-education', 16, 'amenity',         '=', 'music_school'),
  ('other-education', 17, 'amenity',         '=', 'traffic_park'),
  ('driving-schools', 0, 'amenity',        '=', 'driving_school'),
  ('driving-schools', 1, 'tags:education', '=', 'driving_school'),

  -- public-institutions
  ('townhalls',            0, 'amenity',      '=', 'townhall'),
  ('consulates-embassies', 0, 'tags:office',  '=', 'diplomatic'),
  ('police-stations',      0, 'amenity',      '=', 'police'),
  ('courts',               0, 'amenity',      '=', 'courthouse'),
  ('government-offices',   0, 'tags:office',  '=', 'government');

-- ─── Sub-category display tags ───────────────────────────────────────────────

CREATE TABLE scoring_config.scoring_sub_category_display_tags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_category_id TEXT NOT NULL REFERENCES scoring_config.scoring_sub_categories(id),
  tag_key         TEXT NOT NULL,
  tag_value       TEXT NOT NULL
);

INSERT INTO scoring_config.scoring_sub_category_display_tags (sub_category_id, tag_key, tag_value) VALUES
  -- food-and-drinks
  ('drinking-water','shop','water'), ('drinking-water','fountain','drinking'), ('drinking-water','amenity','water_point'), ('drinking-water','amenity','drinking_water'), ('drinking-water','drinking_water','yes'),
  ('bars','amenity','bar'), ('bars','amenity','pub'), ('bars','bar','yes'),
  ('food-stores','shop','butcher'), ('food-stores','shop','cheese'), ('food-stores','shop','dairy'), ('food-stores','shop','chocolate'), ('food-stores','shop','coffee'), ('food-stores','shop','deli'), ('food-stores','shop','farm'), ('food-stores','shop','food'), ('food-stores','shop','greengrocer'), ('food-stores','shop','health_food'), ('food-stores','shop','pasta'), ('food-stores','shop','seafood'), ('food-stores','shop','spices'), ('food-stores','shop','tea'), ('food-stores','shop','nuts'), ('food-stores','shop','tortillas'), ('food-stores','shop','wine'), ('food-stores','shop','alcohol'),
  ('ice-cream','shop','ice_cream'), ('ice-cream','amenity','ice_cream'),
  ('bakeries','shop','bakery'), ('bakeries','shop','confectionery'), ('bakeries','shop','pastry'),
  ('restaurants','amenity','restaurant'),
  ('cafes','amenity','cafe'),
  ('fast-food','amenity','fast_food'),
  ('canteen','amenity','canteen'), ('canteen','fast_food','cafeteria'),
  ('food-court','amenity','food_court'),
  -- health-care
  ('health-counselling','healthcare:counselling','dietitian'), ('health-counselling','healthcare:counselling','nutrition'), ('health-counselling','healthcare:counselling','sexual'), ('health-counselling','healthcare:counselling','antenatal'), ('health-counselling','healthcare:counselling','psychiatry'),
  ('doctors','amenity','doctors'), ('doctors','healthcare','doctor'), ('doctors','healthcare','dentist'), ('doctors','amenity','dentist'), ('doctors','amenity','veterinary'), ('doctors','healthcare','audiologist'), ('doctors','healthcare','nurse'), ('doctors','healthcare','optometrist'), ('doctors','healthcare','podiatrist'),
  ('hospitals','amenity','hospital'), ('hospitals','healthcare','hospital'),
  ('clinics','amenity','clinic'), ('clinics','healthcare','clinic'),
  ('pharmacies','amenity','pharmacy'),
  ('therapists','healthcare','alternative'), ('therapists','healthcare','occupational_therapist'), ('therapists','healthcare','speech_therapist'), ('therapists','healthcare','physiotherapist'),
  ('psycho-therapists','healthcare','psychotherapist'),
  ('other-health-facilities','amenity','health_post'), ('other-health-facilities','healthcare','blood_donation'), ('other-health-facilities','healthcare','dialysis'), ('other-health-facilities','healthcare','hospice'), ('other-health-facilities','healthcare','midwife'), ('other-health-facilities','healthcare','rehabilitation'), ('other-health-facilities','healthcare','sample_collection'), ('other-health-facilities','healthcare','vaccination_centre'), ('other-health-facilities','healthcare','birthing_centre'), ('other-health-facilities','healthcare','postpartum_care'),
  ('health-shops','shop','medical_supply'), ('health-shops','shop','optician'), ('health-shops','amenity','hearing_aids'), ('health-shops','shop','dentures'), ('health-shops','shop','herbalist'),
  -- public-transport (platforms)
  ('bus-platforms','public_transport','platform'), ('bus-platforms','bus','yes'),
  ('tram-platforms','public_transport','platform'), ('tram-platforms','tram','yes'),
  ('subway-platforms','public_transport','platform'), ('subway-platforms','subway','yes'),
  ('train-platforms','public_transport','platform'), ('train-platforms','train','yes'),
  ('ferry-platforms','public_transport','platform'), ('ferry-platforms','ferry','yes'),
  ('light-rail-platforms','public_transport','platform'), ('light-rail-platforms','light_rail','yes'),
  ('bus-stations','public_transport','station'), ('bus-stations','bus','yes'),
  ('tram-stations','public_transport','station'), ('tram-stations','tram','yes'),
  ('subway-stations','public_transport','station'), ('subway-stations','subway','yes'),
  ('train-stations','public_transport','station'), ('train-stations','train','yes'),
  ('ferry-stations','public_transport','station'), ('ferry-stations','ferry','yes'),
  ('light-rail-stations','public_transport','station'), ('light-rail-stations','light_rail','yes'),
  -- social-care
  ('community-centers','amenity','community_centre'), ('community-centers','amenity','social_centre'), ('community-centers','social_facility:for','community'),
  ('counselling-services','healthcare','counselling'), ('counselling-services','healthcare:counselling','addiction'), ('counselling-services','healthcare:counselling','family'), ('counselling-services','social_facility:for','family'),
  ('ambulatory-services','social_facility','ambulatory_care'),
  ('senior-facilities','social_facility:for','senior'),
  ('child-youth-facilities','social_facility:for','juvenile'), ('child-youth-facilities','social_facility:for','child;juvenile'), ('child-youth-facilities','social_facility:for','child'), ('child-youth-facilities','social_facility:for','children'), ('child-youth-facilities','social_facility:for','youth'), ('child-youth-facilities','social_facility:for','orphan'),
  ('disabled-facilities','social_facility:for','disabled'), ('disabled-facilities','social_facility:for','mental_health'),
  ('refugee-accommodations','social_facility','shelter'), ('refugee-accommodations','social_facility:for','refugees'), ('refugee-accommodations','social_facility:for','refugee'), ('refugee-accommodations','social_facility:for','migrant'), ('refugee-accommodations','social_facility:for','migrants'), ('refugee-accommodations','social_facility:for','refugees, migrants'), ('refugee-accommodations','social_facility:for','refugees,migrants,immigrants'), ('refugee-accommodations','social_facility:for','migrants;refugees'), ('refugee-accommodations','social_facility:for','displaced'),
  ('women-mother-shelters','social_facility','shelter'), ('women-mother-shelters','social_facility:for','Women'), ('women-mother-shelters','social_facility:for','women'), ('women-mother-shelters','social_facility:for','woman'), ('women-mother-shelters','social_facility:for','woman;child'), ('women-mother-shelters','social_facility:for','child;woman'), ('women-mother-shelters','social_facility:for','child;women'), ('women-mother-shelters','social_facility:for','women;child'), ('women-mother-shelters','social_facility:for','women;children'),
  ('queer-facilities','social_facility:for','lgbtq'),
  ('addiction-facilities','social_facility:for','drug_addicted'),
  ('clothing-banks','social_facility','clothing_bank'),
  ('charity-shops','shop','charity'),
  ('soup-kitchens-food-banks','social_facility','soup_kitchen'), ('soup-kitchens-food-banks','social_facility','food_bank'),
  -- education
  ('kindergartens','education','kindergarten'), ('kindergartens','amenity','kindergarten'), ('kindergartens','amenity','childcare'),
  ('schools','amenity','school'), ('schools','education','school'),
  ('higher-education','amenity','university'), ('higher-education','amenity','college'), ('higher-education','education','university'), ('higher-education','education','college'), ('higher-education','police','academy'),
  ('other-education','college','adult_education'), ('other-education','education','language_school'), ('other-education','education','music_school'), ('other-education','education','prep_school'), ('other-education','education','facultative_school'), ('other-education','education','dancing_school'), ('other-education','education','cooking_school'), ('other-education','education','ski_school'), ('other-education','education','sailing_school'), ('other-education','education','art_school'), ('other-education','amenity','dancing_school'), ('other-education','amenity','first_aid_school'), ('other-education','amenity','language_school'), ('other-education','amenity','library'), ('other-education','amenity','surf_school'), ('other-education','amenity','research_institute'), ('other-education','amenity','music_school'), ('other-education','amenity','traffic_park'),
  ('driving-schools','amenity','driving_school'), ('driving-schools','education','driving_school'),
  -- public-institutions
  ('townhalls','amenity','townhall'),
  ('consulates-embassies','office','diplomatic'),
  ('police-stations','amenity','police'),
  ('courts','amenity','courthouse'),
  ('government-offices','office','government');

-- ─── Assignments (sub-category × topic × criterion + weight) ─────────────────

CREATE TABLE scoring_config.scoring_assignments (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_category_id          TEXT NOT NULL REFERENCES scoring_config.scoring_sub_categories(id),
  topic_id                 TEXT NOT NULL REFERENCES scoring_config.scoring_topics(id),
  criterion_id             TEXT NOT NULL REFERENCES scoring_config.scoring_criteria(id),
  weight                   DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  reason_override_key      TEXT,
  recommendations_override JSONB,
  links_override           JSONB,
  UNIQUE (sub_category_id, topic_id, criterion_id)
);
CREATE INDEX ON scoring_config.scoring_assignments (sub_category_id);

-- Helper: bulk-insert assignments for a set of sub-categories that share the
-- same topic template.  We use a CTE to define the template once.

-- === genericGastronomyTopics (restaurants, bars, cafes, fast-food, canteen, food-court) ===
INSERT INTO scoring_config.scoring_assignments (sub_category_id, topic_id, criterion_id, weight)
SELECT sc.id, v.topic_id, v.criterion_id, v.weight
FROM (VALUES
  ('mobility',          'is-wheelchair-accessible',         0.8),
  ('mobility',          'has-wheelchair-accessible-toilet',  0.2),
  ('vision',            'is-accessible-to-visually-impaired',0.8),
  ('vision',            'has-menu-on-website',               0.2),
  ('toilet',            'has-toilet',                        1.0),
  ('neurodivergent',    'has-quiet-hours',                   1.0),
  ('air-and-climate',   'smoking-is-prohibited',             0.7),
  ('air-and-climate',   'has-air-conditioning',              0.3),
  ('hearing',           'is-accessible-to-hearing-impaired', 0.7),
  ('hearing',           'reservation-via-website',           0.3),
  ('general-assistance','has-drinking-straws',               1.0)
) AS v(topic_id, criterion_id, weight)
CROSS JOIN (VALUES ('restaurants'),('bars'),('cafes'),('fast-food'),('canteen'),('food-court')) AS sc(id);

-- === genericShopTopics (food-stores) ===
INSERT INTO scoring_config.scoring_assignments (sub_category_id, topic_id, criterion_id, weight)
SELECT sc.id, v.topic_id, v.criterion_id, v.weight
FROM (VALUES
  ('mobility',       'is-wheelchair-accessible',         1.0),
  ('vision',         'is-accessible-to-visually-impaired',0.6),
  ('vision',         'has-menu-on-website',               0.2),
  ('vision',         'has-website',                       0.2),
  ('air-and-climate','has-air-conditioning',              1.0),
  ('hearing',        'is-accessible-to-hearing-impaired', 1.0)
) AS v(topic_id, criterion_id, weight)
CROSS JOIN (VALUES ('food-stores')) AS sc(id);

-- === drinking-water (custom) ===
INSERT INTO scoring_config.scoring_assignments (sub_category_id, topic_id, criterion_id, weight) VALUES
  ('drinking-water', 'mobility', 'is-wheelchair-accessible',          1.0),
  ('drinking-water', 'vision',   'is-accessible-to-visually-impaired',1.0),
  ('drinking-water', 'hearing',  'is-accessible-to-hearing-impaired', 1.0);

-- === ice-cream (custom) ===
INSERT INTO scoring_config.scoring_assignments (sub_category_id, topic_id, criterion_id, weight) VALUES
  ('ice-cream', 'mobility',          'is-wheelchair-accessible',          1.0),
  ('ice-cream', 'vision',            'is-accessible-to-visually-impaired',0.8),
  ('ice-cream', 'vision',            'has-menu-on-website',               0.2),
  ('ice-cream', 'hearing',           'is-accessible-to-hearing-impaired', 1.0),
  ('ice-cream', 'general-assistance','has-drinking-straws',               1.0);

-- === bakeries (custom) ===
INSERT INTO scoring_config.scoring_assignments (sub_category_id, topic_id, criterion_id, weight) VALUES
  ('bakeries', 'mobility',       'is-wheelchair-accessible',          1.0),
  ('bakeries', 'vision',         'is-accessible-to-visually-impaired',0.8),
  ('bakeries', 'vision',         'has-menu-on-website',               0.2),
  ('bakeries', 'air-and-climate','has-air-conditioning',              1.0),
  ('bakeries', 'hearing',        'is-accessible-to-hearing-impaired', 1.0);

-- === clincAndDoctorsTopics (doctors, hospitals, clinics, therapists, psycho-therapists, other-health-facilities) ===
INSERT INTO scoring_config.scoring_assignments (sub_category_id, topic_id, criterion_id, weight)
SELECT sc.id, v.topic_id, v.criterion_id, v.weight
FROM (VALUES
  ('mobility',          'is-wheelchair-accessible',         0.8),
  ('mobility',          'has-wheelchair-accessible-toilet',  0.2),
  ('vision',            'is-accessible-to-visually-impaired',1.0),
  ('toilet',            'has-toilet',                        1.0),
  ('air-and-climate',   'has-air-conditioning',              1.0),
  ('hearing',           'is-accessible-to-hearing-impaired', 1.0),
  ('general-assistance','has-website',                       1.0)
) AS v(topic_id, criterion_id, weight)
CROSS JOIN (VALUES ('doctors'),('hospitals'),('clinics'),('therapists'),('psycho-therapists'),('other-health-facilities')) AS sc(id);

-- === healthCareShopsTopics (health-counselling, pharmacies, health-shops) ===
INSERT INTO scoring_config.scoring_assignments (sub_category_id, topic_id, criterion_id, weight)
SELECT sc.id, v.topic_id, v.criterion_id, v.weight
FROM (VALUES
  ('mobility',          'is-wheelchair-accessible',          1.0),
  ('vision',            'is-accessible-to-visually-impaired',1.0),
  ('air-and-climate',   'has-air-conditioning',              1.0),
  ('hearing',           'is-accessible-to-hearing-impaired', 1.0),
  ('general-assistance','has-website',                       1.0)
) AS v(topic_id, criterion_id, weight)
CROSS JOIN (VALUES ('health-counselling'),('pharmacies'),('health-shops')) AS sc(id);

-- === genericPlatformTopics (bus/tram/train/ferry/light-rail platforms + stations, excluding subway) ===
INSERT INTO scoring_config.scoring_assignments (sub_category_id, topic_id, criterion_id, weight)
SELECT sc.id, v.topic_id, v.criterion_id, v.weight
FROM (VALUES
  ('mobility',          'is-wheelchair-accessible',                  1.0),
  ('hearing',           'is-accessible-to-hearing-impaired',         1.0),
  ('vision',            'is-accessible-to-visually-impaired',        0.1),
  ('vision',            'has-tactile-paving',                        0.35),
  ('vision',            'has-information-board-with-speech-output',   0.35),
  ('vision',            'has-tactile-writing',                       0.2),
  ('general-assistance','has-bench',                                 0.333333),
  ('general-assistance','is-lit',                                    0.333333),
  ('general-assistance','has-shelter',                               0.333333)
) AS v(topic_id, criterion_id, weight)
CROSS JOIN (VALUES
  ('bus-platforms'),('tram-platforms'),('train-platforms'),('ferry-platforms'),('light-rail-platforms'),
  ('bus-stations'),('tram-stations'),('train-stations'),('ferry-stations'),('light-rail-stations')
) AS sc(id);

-- === subwayTopics (subway-platforms, subway-stations) ===
INSERT INTO scoring_config.scoring_assignments (sub_category_id, topic_id, criterion_id, weight)
SELECT sc.id, v.topic_id, v.criterion_id, v.weight
FROM (VALUES
  ('mobility',          'is-wheelchair-accessible',                  1.0),
  ('hearing',           'is-accessible-to-hearing-impaired',         1.0),
  ('vision',            'is-accessible-to-visually-impaired',        0.1),
  ('vision',            'has-tactile-paving',                        0.35),
  ('vision',            'has-information-board-with-speech-output',   0.35),
  ('vision',            'has-tactile-writing',                       0.2),
  ('general-assistance','has-bench',                                 1.0)
) AS v(topic_id, criterion_id, weight)
CROSS JOIN (VALUES ('subway-platforms'),('subway-stations')) AS sc(id);

-- === genericSocialCareTopics (10 sub-categories) ===
INSERT INTO scoring_config.scoring_assignments (sub_category_id, topic_id, criterion_id, weight)
SELECT sc.id, v.topic_id, v.criterion_id, v.weight
FROM (VALUES
  ('mobility',          'is-wheelchair-accessible',         0.8),
  ('mobility',          'has-wheelchair-accessible-toilet',  0.2),
  ('vision',            'is-accessible-to-visually-impaired',1.0),
  ('toilet',            'has-toilet',                        1.0),
  ('air-and-climate',   'has-air-conditioning',              1.0),
  ('hearing',           'is-accessible-to-hearing-impaired', 1.0),
  ('general-assistance','has-website',                       1.0)
) AS v(topic_id, criterion_id, weight)
CROSS JOIN (VALUES
  ('community-centers'),('counselling-services'),('ambulatory-services'),('senior-facilities'),
  ('child-youth-facilities'),('disabled-facilities'),('refugee-accommodations'),
  ('women-mother-shelters'),('queer-facilities'),('addiction-facilities')
) AS sc(id);

-- === socialShopsTopics (clothing-banks, charity-shops, soup-kitchens-food-banks) ===
INSERT INTO scoring_config.scoring_assignments (sub_category_id, topic_id, criterion_id, weight)
SELECT sc.id, v.topic_id, v.criterion_id, v.weight
FROM (VALUES
  ('mobility',          'is-wheelchair-accessible',          1.0),
  ('vision',            'is-accessible-to-visually-impaired',1.0),
  ('air-and-climate',   'has-air-conditioning',              1.0),
  ('hearing',           'is-accessible-to-hearing-impaired', 1.0),
  ('general-assistance','has-website',                       1.0)
) AS v(topic_id, criterion_id, weight)
CROSS JOIN (VALUES ('clothing-banks'),('charity-shops'),('soup-kitchens-food-banks')) AS sc(id);

-- === genericEducationTopics (kindergartens, schools, other-education) ===
INSERT INTO scoring_config.scoring_assignments (sub_category_id, topic_id, criterion_id, weight)
SELECT sc.id, v.topic_id, v.criterion_id, v.weight
FROM (VALUES
  ('mobility',          'is-wheelchair-accessible',         0.5),
  ('mobility',          'has-wheelchair-accessible-toilet',  0.5),
  ('vision',            'is-accessible-to-visually-impaired',1.0),
  ('hearing',           'is-accessible-to-hearing-impaired', 1.0),
  ('general-assistance','has-website',                       1.0),
  ('air-and-climate',   'has-air-conditioning',              1.0)
) AS v(topic_id, criterion_id, weight)
CROSS JOIN (VALUES ('kindergartens'),('schools'),('other-education')) AS sc(id);

-- === higher-education (custom — has hearing-loop) ===
INSERT INTO scoring_config.scoring_assignments (sub_category_id, topic_id, criterion_id, weight) VALUES
  ('higher-education', 'mobility',          'is-wheelchair-accessible',         0.5),
  ('higher-education', 'mobility',          'has-wheelchair-accessible-toilet',  0.5),
  ('higher-education', 'vision',            'is-accessible-to-visually-impaired',1.0),
  ('higher-education', 'hearing',           'is-accessible-to-hearing-impaired', 0.5),
  ('higher-education', 'hearing',           'has-hearing-loop',                  0.5),
  ('higher-education', 'general-assistance','has-website',                       1.0),
  ('higher-education', 'air-and-climate',   'has-air-conditioning',              1.0);

-- === driving-schools (custom — no vision) ===
INSERT INTO scoring_config.scoring_assignments (sub_category_id, topic_id, criterion_id, weight) VALUES
  ('driving-schools', 'mobility',          'is-wheelchair-accessible',         0.5),
  ('driving-schools', 'mobility',          'has-wheelchair-accessible-toilet',  0.5),
  ('driving-schools', 'hearing',           'is-accessible-to-hearing-impaired', 1.0),
  ('driving-schools', 'general-assistance','has-website',                       1.0),
  ('driving-schools', 'air-and-climate',   'has-air-conditioning',              1.0);

-- === genericPublicInstitutionsTopics (all 5 public-institution sub-categories) ===
INSERT INTO scoring_config.scoring_assignments (sub_category_id, topic_id, criterion_id, weight)
SELECT sc.id, v.topic_id, v.criterion_id, v.weight
FROM (VALUES
  ('mobility',          'is-wheelchair-accessible',                0.5),
  ('mobility',          'has-wheelchair-accessible-toilet',         0.5),
  ('vision',            'is-accessible-to-visually-impaired',      0.25),
  ('vision',            'has-tactile-paving',                      0.25),
  ('vision',            'has-information-board-with-speech-output', 0.25),
  ('vision',            'has-tactile-writing',                     0.25),
  ('hearing',           'is-accessible-to-hearing-impaired',       1.0),
  ('general-assistance','has-website',                             1.0),
  ('air-and-climate',   'has-air-conditioning',                    1.0)
) AS v(topic_id, criterion_id, weight)
CROSS JOIN (VALUES ('townhalls'),('consulates-embassies'),('police-stations'),('courts'),('government-offices')) AS sc(id);

-- ─── Sanity checks ───────────────────────────────────────────────────────────

DO $$
DECLARE
  n_topics       INTEGER;
  n_criteria     INTEGER;
  n_rules        INTEGER;
  n_tlc          INTEGER;
  n_sub          INTEGER;
  n_assignments  INTEGER;
BEGIN
  SELECT count(*) INTO n_topics      FROM scoring_config.scoring_topics;
  SELECT count(*) INTO n_criteria    FROM scoring_config.scoring_criteria;
  SELECT count(*) INTO n_rules       FROM scoring_config.scoring_criterion_rules;
  SELECT count(*) INTO n_tlc         FROM scoring_config.scoring_top_level_categories;
  SELECT count(*) INTO n_sub         FROM scoring_config.scoring_sub_categories;
  SELECT count(*) INTO n_assignments FROM scoring_config.scoring_assignments;

  RAISE NOTICE '✓ scoring_config schema created and seeded:';
  RAISE NOTICE '  topics: %,  criteria: %,  rules: %', n_topics, n_criteria, n_rules;
  RAISE NOTICE '  top-level categories: %,  sub-categories: %', n_tlc, n_sub;
  RAISE NOTICE '  assignments: %', n_assignments;
END $$;

COMMIT;

