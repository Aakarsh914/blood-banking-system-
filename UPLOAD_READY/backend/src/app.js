import cors from "cors";
import express from "express";
import routes from "./routes/index.js";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";

const app = express();

app.use(
  cors({
    origin: env.frontendOrigin
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
      <h1 style="color: #e53e3e;">Blood Bank Cloud API is Online 🟢</h1>
      <p>The backend server is securely running.</p>
    </div>
  `);
});

app.use("/api", routes);
app.use(errorMiddleware);

export default app;
