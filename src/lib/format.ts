import type { Timestamp } from 'firebase/firestore';

const euro = new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' });
const dayMonth = new Intl.DateTimeFormat('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const hourMinute = new Intl.DateTimeFormat('ca-ES', { hour: '2-digit', minute: '2-digit' });

export function formatPrice(value: number): string {
  return euro.format(value);
}

export function toDate(value: Timestamp | Date | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : value.toDate();
}

export function formatDay(value: Timestamp | Date | null | undefined): string {
  const date = toDate(value);
  return date ? dayMonth.format(date) : 'Data per confirmar';
}

export function formatTime(value: Timestamp | Date | null | undefined): string {
  const date = toDate(value);
  return date ? hourMinute.format(date) : '--:--';
}

export function formatDayTime(value: Timestamp | Date | null | undefined): string {
  const date = toDate(value);
  return date ? `${dayMonth.format(date)} · ${hourMinute.format(date)}` : 'Per confirmar';
}

/** Valor per a un <input type="datetime-local">. */
export function toDateTimeLocal(value: Timestamp | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
