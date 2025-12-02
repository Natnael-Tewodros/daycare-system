"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// lib/prisma.ts
var client_1 = require("@prisma/client");
var globalForPrisma = globalThis;
var prisma = (_a = globalForPrisma.prisma) !== null && _a !== void 0 ? _a : new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
    __internal: {
        engine: {
            connection_limit: 20,
        },
    },
});
exports.prisma = prisma;
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = prisma;
