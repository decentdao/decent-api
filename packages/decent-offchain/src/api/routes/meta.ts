import { Hono } from "hono";
import resf from "@/api/utils/responseFormatter";

const app = new Hono();

app.get("/", (c) => {
  const version = process.env.RAILWAY_GIT_COMMIT_SHA || "local";
  const info = {
    name: "decent-offchain",
    version,
  };
  return resf(c, info);
});

app.get("/health", (c) => {
  const status = "ok"
  return resf(c, status);
});

export default app;
