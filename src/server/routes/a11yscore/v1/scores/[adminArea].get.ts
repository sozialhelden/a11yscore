import { langQueryParameter } from "~/utils/openApi";
import routeHandler from "~~/src/a11yscore/routes/v1/get-score";

export default routeHandler;

defineRouteMeta({
  openAPI: {
    tags: ["a11y-Score v1"],
    description: "Get the latest score for a given admin area",
    parameters: [
      {
        in: "path",
        name: "adminArea",
        schema: {
          type: "string",
          example: "berlin",
        },
        description: "Slug of the admin area to get the score for",
      },
      langQueryParameter,
    ],
    responses: {
      "200": {
        description: "Successful response",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                score: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      example: "0b9b4c6a-0572-4876-99ce-2d2ca1dd0ef4",
                      description: "uuid of this score record",
                    },
                    adminArea: {
                      type: "object",
                      properties: {
                        id: {
                          type: "integer",
                          example: "-62422",
                          description:
                            "OSM id of the admin area this score is calculated for",
                        },
                        name: {
                          type: "string",
                          example: "Berlin",
                          description:
                            "Name of the admin area this score is calculated for",
                        },
                      },
                    },
                    score: {
                      type: "number",
                      example: "75",
                      nullable: true,
                      description:
                        "Overall a11y-score for the given admin area",
                    },
                    createdAt: {
                      type: "string",
                      format: "date-time",
                      example: "2023-10-01T12:34:56Z",
                      description: "Timestamp when this score was calculated",
                    },

                    toplevelCategories: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: {
                            type: "string",
                            example: "transportation",
                            description:
                              "Identifier of this top-level category",
                          },
                          name: {
                            type: "string",
                            example: "Transportation",
                            description: "Name of the top-level category",
                          },
                          score: {
                            type: "integer",
                            example: 80,
                            nullable: true,
                            description: "Score for this top-level category",
                          },
                          interpretation: {
                            type: "string",
                            example: "Good accessibility",
                            nullable: true,
                            description: "Text interpretation of the score",
                          },
                          subCategories: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                id: {
                                  type: "string",
                                  example: "railway-stations",
                                  description:
                                    "Identifier of this sub-category",
                                },
                                name: {
                                  type: "string",
                                  example: "Railway stations",
                                  description: "Name of the sub-category",
                                },
                                score: {
                                  type: "integer",
                                  example: 70,
                                  nullable: true,
                                  description: "Score for this sub-category",
                                },
                                description: {
                                  type: "string",
                                  example:
                                    "Includes subway stations, tram halts and railway stations",
                                  nullable: true,
                                  description:
                                    "Description of the sub-category",
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
                                topics: {
                                  type: "array",
                                  items: {
                                    type: "object",
                                    properties: {
                                      id: {
                                        type: "string",
                                        example: "mobility",
                                        description: "Identifier of this topic",
                                      },
                                      name: {
                                        type: "string",
                                        example: "Mobility",
                                        description: "Name of the topic",
                                      },
                                      score: {
                                        type: "integer",
                                        example: 60,
                                        nullable: true,
                                        description: "Score for this topic",
                                      },
                                      criteria: {
                                        type: "array",
                                        items: {
                                          type: "object",
                                          properties: {
                                            id: {
                                              type: "string",
                                              example:
                                                "is-wheelchair-accessible",
                                              description:
                                                "Identifier of this criterion",
                                            },
                                            name: {
                                              type: "string",
                                              example:
                                                "Is wheelchair accessible",
                                              description:
                                                "Name of the criterion",
                                            },
                                            score: {
                                              type: "integer",
                                              example: 50,
                                              nullable: true,
                                              description:
                                                "Score for this criterion",
                                            },
                                            reason: {
                                              type: "string",
                                              example:
                                                "Wheelchair users must be able to access the facility without assistance.",
                                              description:
                                                "Explanation why this criterion is relevant",
                                            },
                                            recommendations: {
                                              type: "array",
                                              description:
                                                "Recommendations to improve accessibility for this criterion",
                                              items: {
                                                type: "string",
                                                example:
                                                  "Install ramps and elevators to ensure wheelchair accessibility.",
                                              },
                                            },
                                            links: {
                                              type: "array",
                                              description:
                                                "A list of links that provide more information about this criterion.",
                                              items: {
                                                type: "object",
                                                properties: {
                                                  url: {
                                                    type: "string",
                                                    example:
                                                      "https://www.example.com/din-18040",
                                                    description:
                                                      "URL of the link",
                                                  },
                                                  label: {
                                                    type: "string",
                                                    example:
                                                      "DIN 18040 - Accessible building design",
                                                    description:
                                                      "Label of the link",
                                                  },
                                                },
                                              },
                                            },
                                            osmTags: {
                                              type: "array",
                                              items: {
                                                type: "object",
                                                description:
                                                  "An OSM tag key/value pair relevant to the criterion.",
                                                properties: {
                                                  key: {
                                                    type: "string",
                                                    example: "wheelchair",
                                                  },
                                                  value: {
                                                    type: "string",
                                                    example: "yes",
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
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "404": {
        description: "Not found",
      },
    },
  },
});
