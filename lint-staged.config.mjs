/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
	"**/*.{js,ts,json}": ["biome format --write", "biome lint --write"],
};
