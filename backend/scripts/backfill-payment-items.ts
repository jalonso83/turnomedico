/**
 * Backfill de líneas de factura.
 *
 * Los cobros registrados antes de que existiera `PaymentItem` guardan un solo
 * monto plano. Este script les crea la línea CONSULTATION equivalente, para que
 * el desglose consulta/servicios de la caja no los deje fuera.
 *
 * Es idempotente: solo toca los pagos que no tienen ninguna línea.
 *
 *   npx ts-node scripts/backfill-payment-items.ts          (simulación)
 *   npx ts-node scripts/backfill-payment-items.ts --apply  (escribe)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

async function main() {
  const pendientes = await prisma.consultationPayment.findMany({
    where: { items: { none: {} } },
    select: {
      id: true,
      fee: true,
      cashAmount: true,
      insuranceAmount: true,
      isCourtesy: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Cobros sin líneas: ${pendientes.length}`);
  if (pendientes.length === 0) {
    console.log('Nada que hacer.');
    return;
  }

  const filas = pendientes.map((p) => ({
    paymentId: p.id,
    kind: 'CONSULTATION' as const,
    serviceId: null,
    description: p.isCourtesy ? 'Consulta (cortesía)' : 'Consulta',
    // Si `fee` venía en 0 pero se cobró algo, se reconstruye desde el reparto.
    unitPrice: p.fee > 0 ? p.fee : p.cashAmount + p.insuranceAmount,
    quantity: 1,
    cashAmount: p.cashAmount,
    insuranceAmount: p.insuranceAmount,
    sortOrder: 0,
  }));

  const suma = filas.reduce((s, f) => s + f.cashAmount + f.insuranceAmount, 0);
  console.log(`Monto total que se va a respaldar en líneas: ${suma.toFixed(2)}`);
  console.log('Muestra:', filas.slice(0, 3));

  if (!APPLY) {
    console.log('\nSimulación. Vuelve a correrlo con --apply para escribir.');
    return;
  }

  const res = await prisma.paymentItem.createMany({ data: filas });
  console.log(`Líneas creadas: ${res.count}`);

  const quedan = await prisma.consultationPayment.count({ where: { items: { none: {} } } });
  console.log(`Cobros que siguen sin líneas: ${quedan}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
