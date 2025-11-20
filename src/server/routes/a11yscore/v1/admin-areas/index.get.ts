import { langQueryParameter } from "~/utils/openApi";
import routeHandler from "~~/src/a11yscore/routes/v1/get-admin-areas";

export default routeHandler;

defineRouteMeta({
  openAPI: {
    tags: ["a11y-Score v1"],
    description: "Get a list of available admin areas",
    parameters: [langQueryParameter],
    $global: {
      components: {
        schemas: {
          AdminArea: {
            type: "object",
            properties: {
              id: {
                type: "string",
                example: "a88c5e9c-af7f-4e0e-9259-6843b0810bf2",
                description: "a11y-Score specific uuid of the admin area",
              },
              osmId: {
                type: "number",
                example: 62422,
                description: "OSM ID of the admin area",
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
              wikidata: {
                type: "string",
                example: "Q64",
                description: "Wikidata identifier of the admin area",
              },
              adminLevel: {
                type: "number",
                example: 4,
                description: "OSM admin level of the admin area",
              },
              image: {
                type: "object",
                nullable: true,
                properties: {
                  url: {
                    type: "string",
                    example:
                      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Berlin_Skyline_Fernsehturm_02_2016-11-12_edited.jpg/1200px-Berlin_Skyline_Fernsehturm_02_2016-11-12_edited.jpg",
                    description: "URL of the image",
                    nullable: true,
                  },
                  artist: {
                    type: "string",
                    example: '<a href="https://localhost">User:Stör</a>',
                    description: "Artist of the image",
                    nullable: true,
                  },
                  license: {
                    type: "string",
                    example: "CC BY-SA 4.0",
                    description: "License of the image",
                    nullable: true,
                  },
                  fileName: {
                    type: "string",
                    example:
                      "Berlin_Skyline_Fernsehturm_02_2016-11-12_edited.jpg",
                    description: "File name of the image",
                    nullable: true,
                  },
                },
              },
            },
          },
        },
      },
    },
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
                    $ref: "#/components/schemas/AdminArea",
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
