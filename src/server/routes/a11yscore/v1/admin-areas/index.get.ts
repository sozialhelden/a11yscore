import { langQueryParameter } from "~/utils/openApi";
import routeHandler from "~~/src/a11yscore/routes/v1/get-admin-areas";

export default routeHandler;

defineRouteMeta({
  openAPI: {
    tags: ["a11y-Score v1"],
    description: "Get a list of available admin areas",
    parameters: [langQueryParameter],
    responses: {
      "200": {
        description: "Successful response",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                adminAreas: {
                  type: "array",
                  description: "List of available admin areas",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "integer",
                        example: 62422,
                        description: "OSM id of the admin area",
                      },
                      name: {
                        type: "string",
                        example: "Berlin",
                        description: "Name of the admin area",
                      },
                      slug: {
                        type: "string",
                        example: "berlin",
                        description: "Slug of the admin area",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});
