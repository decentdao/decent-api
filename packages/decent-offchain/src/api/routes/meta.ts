import { Hono } from "hono";
import json from "@/api/utils/responseFormatter";

const app = new Hono();

app.get("/", (c) => {
  const version = process.env.RAILWAY_GIT_COMMIT_SHA || "local";
  const info = {
    name: "decent-offchain",
    version,
  };
  return json(c, info);
});

app.get("/health", (c) => {
  const status = "ok"
  return json(c, status);
});

export default app;
