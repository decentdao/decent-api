import { Hono } from "hono";
import jsonf from "@/api/utils/responseFormatter";
import meta from "@/api/routes/meta";
import proposals from "@/api/routes/proposals";

const app = new Hono();

app.onError((err, c) => {
  return jsonf(c, err);
});

app.notFound((c) => {
  const error = new Error("Not found");
  return jsonf(c, error);
});

// Routes
app.route("/", meta);
app.route("/proposal", proposals);


export default app;
