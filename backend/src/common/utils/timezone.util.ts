/**
 * Dominican Republic timezone utilities
 * Dominican Standard Time (AST): UTC-4, no daylight saving
 */

export const RD_TIMEZONE = 'America/Santo_Domingo';

/** Offset fijo de RD (AST, UTC-4, sin horario de verano). */
export const RD_OFFSET_MS = 4 * 60 * 60 * 1000;

export function nowInRD(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: RD_TIMEZONE }),
  );
}

export function todayInRD(): string {
  return nowInRD().toISOString().split('T')[0];
}

/**
 * Convierte 'YYYY-MM-DD' en un Date a medianoche UTC.
 *
 * Las columnas `@db.Date` de Prisma guardan/leen solo la parte de fecha del
 * valor UTC del Date. Construir la fecha con `new Date('YYYY-MM-DDT00:00:00')`
 * la interpreta en la zona LOCAL del servidor, por lo que en un servidor con
 * offset positivo (o distinto a UTC) la fecha podía correrse un día. Anclar a
 * medianoche UTC la hace determinista sin importar la zona del servidor.
 */
export function dateOnlyUTC(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/** Fecha de calendario "hoy" en RD como string 'YYYY-MM-DD'. */
export function todayRDString(): string {
  return new Date(Date.now() - RD_OFFSET_MS).toISOString().slice(0, 10);
}

/** "Hoy" en RD como Date a medianoche UTC (para guardar/consultar `@db.Date`). */
export function todayRDDate(): Date {
  return dateOnlyUTC(todayRDString());
}

/** Hora actual en RD como string 'HH:MM'. */
export function currentTimeRDString(): string {
  return new Date(Date.now() - RD_OFFSET_MS).toISOString().slice(11, 16);
}

export function formatTimeRD(date: Date): string {
  return date.toLocaleTimeString('es-DO', {
    timeZone: RD_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
