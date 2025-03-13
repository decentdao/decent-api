import { Hono } from "hono";
import json from "@/api/utils/responseFormatter";

// Routes
import meta from "@/api/routes/meta";
import dao from "@/api/routes/dao";
import proposals from "@/api/routes/proposals";

const app = new Hono();

app.onError((err, c) => {
  return json(c, err);
});

// Routes
app.route("/", meta);
app.route("/d", dao);
app.route("/proposal", proposals);


export default app;
