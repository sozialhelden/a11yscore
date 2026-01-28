/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
  "**/*.{js,ts}": ["biome format --write", "biome lint --write"],
  "**/*.{md}": ["alex -w"],
};
