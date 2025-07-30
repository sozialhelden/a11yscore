// need to use the default import because this package doesn't include
// an es module ¯\_(ツ)_/¯
import transifex from "@transifex/native";

export default defineNitroPlugin(() => {
	transifex.tx.init({
		token: useRuntimeConfig().transifex.token,
	});
});

export const t = transifex.t;
export const tx = transifex.tx;
