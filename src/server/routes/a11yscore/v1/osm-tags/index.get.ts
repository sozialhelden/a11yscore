import { langQueryParameter } from "~/utils/openApi";
import routeHandler from "~~/src/a11yscore/routes/v1/get-osm-tags";

export default routeHandler;

defineRouteMeta({
  openAPI: {
    tags: ["a11y-Score v1"],
    description: "Get osm-tags used in the a11y-Score algorithm.",
    parameters: [langQueryParameter],
    responses: {
      "200": {
        description: "Successful response",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                topLevelCategories: {
                  type: "array",
                  description:
                    "An array of top-level categories, each containing sub-categories and their associated OSM tags.",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        description:
                          "The unique identifier for the top-level category.",
                        example: "food-and-drinks",
                      },
                      name: {
                        type: "string",
                        description: "The name of the category.",
                        example: "Food and Drinks",
                      },
                      subCategories: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: {
                              type: "string",
                              description:
                                "The unique identifier for the sub-category.",
                              example: "restaurants",
                            },
                            name: {
                              type: "string",
                              description: "The name of the sub-category.",
                              example: "Restaurants",
                            },
                            description: {
                              type: "string",
                              description:
                                "A brief description of the sub-category.",
                              example:
                                "This sub-category covers restaurants and cafes.",
                            },
                            osmTags: {
                              type: "array",
                              items: {
                                type: "object",
                                description:
                                  "An OSM tag key/value pair relevant to the sub-category.",
                                properties: {
                                  key: {
                                    type: "string",
                                    example: "amenity",
                                  },
                                  value: {
                                    type: "string",
                                    example: "restaurant",
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
                criteria: {
                  type: "array",
                  description:
                    "An array of criteria used in the a11y-Score algorithm, each with associated OSM tags.",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        description: "The unique identifier for the criterion.",
                        example: "is-wheelchair-accessible",
                      },
                      name: {
                        type: "string",
                        description: "The name of the criterion.",
                        example: "Is wheelchair accessible",
                      },
                      description: {
                        type: "string",
                        description: "A brief description of the criterion.",
                        example:
                          "This criterion checks if the place is accessible to wheelchair users.",
                      },
                      osmTags: {
                        type: "array",
                        items: {
                          type: "object",
                          description:
                            "An OSM tag key/value pair relevant to the sub-category.",
                          properties: {
                            key: {
                              type: "string",
                              example: "wheelchair",
                            },
                            value: {
                              type: "string",
                              example: "*",
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
      },
    },
  },
});
