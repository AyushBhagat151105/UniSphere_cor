import { env } from "@UniSphere_cor/env/server";
import cors from "cors";
import express, { type Express } from "express";
import { apiReference } from "@scalar/express-api-reference";
import { generateOpenApiDocument } from "./utils/openapi";
import clubsRouter from "./modules/clubs/routes/clubs.routes";
import authRouter from "./modules/auth/routes/auth.routes";
import { errorHandler } from "./utils/error-handler";

export const app: Express = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
  }),
);

app.use(express.json());

// OpenAPI generator endpoint
app.get("/api/openapi.json", (_req, res) => {
  const document = generateOpenApiDocument();
  res.json(document);
});

// Scalar API Reference Gateway
app.use(
  "/api/docs",
  apiReference({
    spec: {
      url: "/api/openapi.json",
    },
    theme: "purple", 
  })
);

// Mount the demonstrated router
app.use(clubsRouter);
app.use(authRouter);

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
    console.log("Interactive API Documentation: http://localhost:3000/api/docs");
  });
}
