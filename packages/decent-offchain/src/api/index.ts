import { Hono } from "hono";
import resf from "@/api/utils/responseFormatter";

// Routes
import meta from "@/api/routes/meta";
import auth from "@/api/routes/auth";
import dao from "@/api/routes/dao";

const app = new Hono()
  .route("/", meta)
  .route("/auth", auth)
  .route("/d", dao);

app.onError((err, c) => {
  return resf(c, err, 500);
});

// Routes
app.route("/", meta);
app.route("/auth", auth);
app.route("/d", dao);

export default app;
