defineRouteMeta({
  openAPI: {
    // global openAPI settings for the entire server
    $global: {
      components: {
        securitySchemes: {
          internalBasicAuth: {
            type: "http",
            scheme: "basic",
          },
        },
      },
    },
  },
});

export default defineEventHandler(async (event) => {
  // redirect to scalar api docs
  return sendRedirect(event, "/docs");
});
