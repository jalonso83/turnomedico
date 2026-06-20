export const APP_NAME = "TurnoMedico";

export const SPECIALTIES = [
  "Medicina General",
  "Pediatría",
  "Ginecología",
  "Cardiología",
  "Dermatología",
  "Oftalmología",
  "Otorrinolaringología",
  "Traumatología",
  "Neurología",
  "Psiquiatría",
  "Urología",
  "Gastroenterología",
  "Endocrinología",
  "Neumología",
  "Odontología",
  "Cirugía General",
  "Medicina Interna",
  "Nutriología",
  "Otra",
] as const;

export const CITIES_RD = [
  "Santo Domingo",
  "Santiago",
  "La Romana",
  "San Pedro de Macorís",
  "Puerto Plata",
  "San Francisco de Macorís",
  "La Vega",
  "Higüey",
  "San Cristóbal",
  "Moca",
  "Bonao",
  "Baní",
  "Azua",
  "Barahona",
  "Nagua",
] as const;

export const APPOINTMENT_STATUS = {
  PENDING: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Confirmada", color: "bg-blue-100 text-blue-800" },
  ARRIVED: { label: "En sala", color: "bg-purple-100 text-purple-800" },
  IN_PROGRESS: { label: "En consulta", color: "bg-green-100 text-green-800" },
  COMPLETED: { label: "Completada", color: "bg-gray-100 text-gray-800" },
  CANCELLED_PATIENT: { label: "Cancelada", color: "bg-red-100 text-red-800" },
  CANCELLED_DOCTOR: { label: "Cancelada", color: "bg-red-100 text-red-800" },
  NO_SHOW: { label: "No asistió", color: "bg-orange-100 text-orange-800" },
} as const;

export const DAYS_OF_WEEK = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;
