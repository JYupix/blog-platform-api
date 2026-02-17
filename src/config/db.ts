import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { ENV } from "./env.js";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Update connection string to use verify-full SSL mode
const connectionString = ENV.DATABASE_URL?.replace(
  /sslmode=(require|prefer|verify-ca)/g,
  'sslmode=verify-full'
);

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString,
  ssl: ENV.NODE_ENV === "production" 
    ? { rejectUnauthorized: true } 
    : false,
});

// Create the adapter
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

