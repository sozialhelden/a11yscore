import transifex from "@transifex/native";

// Because this is a server plugin, this should only be initialized once
// when the server starts, not on every request. Also we want to use
// nitros runtime config.
export default defineNitroPlugin((nitro) => {
  const tx = transifex.createNativeInstance({
    token: useRuntimeConfig().transifex.token,
  });

  nitro.hooks.hook("request", async (event) => {
    // Each request has access to the transifex instance if needed.
    // Translations themselves are handled via the middleware
    event.context.tx = tx;
  });
});
