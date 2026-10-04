import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const parsed = dotenv.parse(fs.readFileSync(envPath));
      for (const k in parsed) {
        if (!process.env[k]) {
          process.env[k] = parsed[k];
        }
      }
    }
  } catch (e) {
    console.error("Failed to load .env in prisma.ts:", e);
  }
}

const g = globalThis as unknown as { prisma?: PrismaClient };
if (!g.prisma) {
  g.prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}
export const prisma = g.prisma;
