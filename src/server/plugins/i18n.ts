import { tx } from "~/utils/i18n";

// Because this is a server plugin, this should only be initialized once
// when the server starts, not on every request.
export default defineNitroPlugin(() => {
	tx.init({
		token: useRuntimeConfig().transifex.token,
	});
});
