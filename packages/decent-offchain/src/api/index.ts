import { Hono } from "hono";
import resf from "@/api/utils/responseFormatter";

// Routes
import meta from "@/api/routes/meta";
import auth from "@/api/routes/auth";
import dao from "@/api/routes/dao";
import proposals from "@/api/routes/proposals";

const app = new Hono();

app.onError((err, c) => {
  return resf(c, err, 500);
});
console.log(Bun.env.PONDER_RPC_URL_1)
// Routes
app.route("/", meta);
app.route("/auth", auth);
app.route("/d", dao);
app.route("/proposal", proposals);


export default app;
