import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "@better-auth/mongo-adapter";

const uri = process.env.MONGODB_URI || "";
if (!uri && process.env.NODE_ENV === "production") {
  console.warn("MONGODB_URI is not defined in environment variables.");
}

let client;
if (process.env.NODE_ENV === "development") {
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri);
  }
  client = global._mongoClient;
} else {
  client = new MongoClient(uri);
}

const dbName = process.env.DB_NAME || "CodingHub";
const db = client.db(dbName);

const authBaseUrl = (
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

const trustedOrigins = [
  authBaseUrl,
  process.env.BETTER_AUTH_URL,
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.BACKEND_URL,
  process.env.NEXT_PUBLIC_BACKEND_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
]
  .filter(Boolean)
  .map((origin) => origin.replace(/\/+$/, ""));

export const auth = betterAuth({
  baseURL: authBaseUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: Array.from(new Set(trustedOrigins)),
  database: mongodbAdapter(db, {
    client,
  }),
  plugins: [bearer()],
  ...(process.env.COOKIE_DOMAIN
    ? {
        advanced: {
          crossSubDomainCookies: {
            enabled: true,
            domain: process.env.COOKIE_DOMAIN,
          },
        },
      }
    : {}),
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
});
