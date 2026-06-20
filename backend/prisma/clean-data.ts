/**
 * Limpieza de datos transaccionales (entorno NO productivo).
 *
 * Borra pacientes, citas y todo lo derivado (expedientes, recetas, signos
 * vitales, notas, recordatorios, métricas, notificaciones y reseñas).
 *
 * CONSERVA: doctores/consultorios (tenants, doctor_profiles, users),
 * horarios, overrides, configuración de pantalla, seguros, planes y
 * suscripciones.
 *
 * Uso (desde turnomedico/backend):
 *   npx ts-node prisma/clean-data.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando datos transaccionales (conservando doctores y consultorios)...\n');

  // Orden respetando llaves foráneas (de hojas a raíces).
  const steps: Array<[string, () => Promise<{ count: number }>]> = [
    ['Notificaciones', () => prisma.notification.deleteMany()],
    ['Reseñas', () => prisma.review.deleteMany()],
    ['Smart reminders', () => prisma.smartReminder.deleteMany()],
    ['Métricas de consulta', () => prisma.doctorConsultationMetric.deleteMany()],
    ['Notas de consulta', () => prisma.consultationNote.deleteMany()],
    ['Signos vitales', () => prisma.vitalSigns.deleteMany()],
    ['Recetas', () => prisma.prescription.deleteMany()],
    ['Citas', () => prisma.appointment.deleteMany()],
    ['Fichas paciente-consultorio', () => prisma.tenantPatient.deleteMany()],
    ['Pacientes', () => prisma.patient.deleteMany()],
  ];

  for (const [label, run] of steps) {
    const { count } = await run();
    console.log(`  ✔ ${label}: ${count} eliminados`);
  }

  // Resumen de lo conservado
  const [tenants, doctors, users, schedules] = await Promise.all([
    prisma.tenant.count(),
    prisma.doctorProfile.count(),
    prisma.user.count(),
    prisma.schedule.count(),
  ]);

  console.log('\n✅ Limpieza completa. Conservado:');
  console.log(`  • Consultorios (tenants): ${tenants}`);
  console.log(`  • Perfiles médicos: ${doctors}`);
  console.log(`  • Usuarios: ${users}`);
  console.log(`  • Horarios: ${schedules}`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante la limpieza:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
