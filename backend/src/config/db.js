import pkgPrisma from '@prisma/client';
import pkgPg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const { PrismaClient } = pkgPrisma;
const { Pool } = pkgPg;

// Configura o pool de conexões com o PostgreSQL (Neon.tech)
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Instancia o PrismaClient injetando o adaptador do driver PG
export const prisma = new PrismaClient({ adapter });