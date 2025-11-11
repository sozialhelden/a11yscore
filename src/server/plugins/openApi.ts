export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook(
    "beforeResponse",
    (event, { body }: { body: { paths: Record<string, string> } }) => {
      if (event.path === "/openapi.json") {
        // remove some of the internal entries from the openapi.json
        const entriesToDelete = ["/openapi.json", "", "/", "/docs", "/health"];
        entriesToDelete.forEach((entry) => {
          delete body.paths[entry];
        });
      }
    },
  );
});
