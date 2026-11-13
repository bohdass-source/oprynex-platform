import handler from "@tanstack/react-start/server-entry";
import { earlyResponse, withSecurityHeaders } from "@/lib/http-policy";

type Entry = { fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response };

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    return withSecurityHeaders(earlyResponse(request) ?? (await (handler as Entry).fetch(request, env, ctx)));
  },
};
