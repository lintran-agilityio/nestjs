// libs
import swaggerJsDoc from "swagger-jsdoc";
import path from "path";
import fs from "fs";

import { PORT, API_PREFIX } from "@/constants";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Instagram Clone APIs",
      version: "1.0.0",
      description:
        "A comprehensive API for Instagram-like social media platform featuring user authentication, posts management, and social interactions",
      contact: {
        name: "API Support",
        email: "support@instagram-clone.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}${API_PREFIX}`,
        description: "Development server",
      },
      {
        url: `https://instagram-apis-dcl1.onrender.com${API_PREFIX}`,
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            username: { type: "string" },
            email: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Post: {
          type: "object",
          properties: {
            id: { type: "string" },
            content: { type: "string" },
            authorId: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        PaginationMeta: {
          type: "object",
          properties: {
            totalItems: { type: "number" },
            totalPages: { type: "number" },
            currentPage: { type: "number" },
            pageSize: { type: "number" },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: "Unauthorized - invalid or missing token",
        },
        InternalServerError: {
          description: "Internal server error",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // 👉 absolute glob: hỗ trợ cả .ts khi dev và .js khi build
  apis: [
    path.join(__dirname, "../routes/**/*.{ts,js}"),
    path.join(__dirname, "../controllers/**/*.{ts,js}"),
  ],
};

export const swaggerSpec = swaggerJsDoc(options);

// optional: ghi file JSON ra disk để debug
fs.writeFileSync("swagger.json", JSON.stringify(swaggerSpec, null, 2));

const numPaths = swaggerSpec && (swaggerSpec as any).paths
  ? Object.keys((swaggerSpec as any).paths).length
  : 0;
console.log(`[Swagger] Discovered ${numPaths} API paths`);
if (numPaths === 0) {
  console.warn("[Swagger] No routes discovered. Scanned patterns:", options.apis);
  console.warn("[Swagger] Current working directory:", process.cwd());
  console.warn("[Swagger] __dirname:", __dirname);
} else {
  console.log("[Swagger] Discovered paths:", Object.keys((swaggerSpec as any).paths || {}));
}
