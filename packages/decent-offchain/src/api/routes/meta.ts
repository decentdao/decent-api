import { Hono } from "hono";
import jsonf from "@/api/utils/responseFormatter";

const app = new Hono();

app.get("/", (c) => {
  const version = process.env.RAILWAY_GIT_COMMIT_SHA || "local";
  const info = {
    name: "decent-offchain",
    version,
  };
  return jsonf(c, info);
});

app.get("/health", (c) => {
  const status = "ok"
  return jsonf(c, status);
});

export default app;
