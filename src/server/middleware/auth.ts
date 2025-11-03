/**
 * This middleware adds basic auth to all endpoints, that follow
 * the pattern /[a-z]/v[0-9]/auth/**
 */
export default defineEventHandler(async (event) => {
  if (
    getRequestURL(event).pathname.match(/^\/[a-zA-Z0-9]*\/v[0-9]*\/auth\/.*$/)
  ) {
    const { internalAuth } = useRuntimeConfig();

    const [_, header] =
      event.headers.get("authorization")?.match(/^Basic (.*)$/) || [];

    const [user, password] = Buffer.from(header || "", "base64")
      .toString()
      .split(":");

    if (
      !user ||
      !password ||
      user !== internalAuth.user ||
      password !== internalAuth.password
    ) {
      throw createError({
        status: 401,
        statusMessage: "Unauthorized",
      });
    }
  }
});
