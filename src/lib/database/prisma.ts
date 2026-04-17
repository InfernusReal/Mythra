import { PrismaClient } from "@prisma/client";

declare global {
  var __mythraPrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__mythraPrisma__ ??
  new PrismaClient({
    log: ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__mythraPrisma__ = prisma;
}
