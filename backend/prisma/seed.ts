import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const insurances = [
  { name: 'ARS Humano', slug: 'humano', shortName: 'Humano', sortOrder: 10 },
  { name: 'ARS Palic Salud', slug: 'palic', shortName: 'Palic', sortOrder: 20 },
  { name: 'ARS SeNaSa', slug: 'senasa', shortName: 'SeNaSa', sortOrder: 30 },
  { name: 'ARS Universal', slug: 'universal', shortName: 'Universal', sortOrder: 40 },
  { name: 'ARS Mapfre Salud', slug: 'mapfre', shortName: 'Mapfre', sortOrder: 50 },
  { name: 'ARS Reservas', slug: 'reservas', shortName: 'Reservas', sortOrder: 60 },
  { name: 'ARS Yunen', slug: 'yunen', shortName: 'Yunen', sortOrder: 70 },
  { name: 'ARS Monumental', slug: 'monumental', shortName: 'Monumental', sortOrder: 80 },
  { name: 'ARS APS', slug: 'aps', shortName: 'APS', sortOrder: 90 },
  { name: 'ARS Constitución', slug: 'constitucion', shortName: 'Constitución', sortOrder: 100 },
  { name: 'ARS Renacer', slug: 'renacer', shortName: 'Renacer', sortOrder: 110 },
  { name: 'ARS Futuro', slug: 'futuro', shortName: 'Futuro', sortOrder: 120 },
  { name: 'ARS Asemap', slug: 'asemap', shortName: 'Asemap', sortOrder: 130 },
  { name: 'ARS Plan Salud Banco Central', slug: 'plan-salud-bc', shortName: 'Plan Salud BC', sortOrder: 140 },
  { name: 'ARS Simag', slug: 'simag', shortName: 'Simag', sortOrder: 150 },
  { name: 'ARS Meta Salud', slug: 'meta-salud', shortName: 'Meta Salud', sortOrder: 160 },
  { name: 'ARS GMA', slug: 'gma', shortName: 'GMA', sortOrder: 170 },
];

async function main() {
  for (const ins of insurances) {
    await prisma.insurance.upsert({
      where: { slug: ins.slug },
      update: { name: ins.name, shortName: ins.shortName, sortOrder: ins.sortOrder, isActive: true },
      create: ins,
    });
  }
  console.log(`Seeded ${insurances.length} insurances.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
