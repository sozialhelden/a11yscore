import routeHandler from "~~/src/a11yscore/routes/v1/debug-query";

export default routeHandler;

defineRouteMeta({
  openAPI: {
    tags: ["a11y-Score v1"],
    description: "Get a list of available admin areas",
  },
});
