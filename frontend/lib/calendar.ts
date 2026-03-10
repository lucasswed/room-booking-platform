export const SLOT_MINUTES = 30;
export const START_HOUR = 0;
export const END_HOUR = 24;
export const SLOT_COUNT = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;
export const ROW_HEIGHT_PX = 28;

export function slotToMinutes(slot: number): number {
  return START_HOUR * 60 + slot * SLOT_MINUTES;
}

export function slotToLabel(slot: number): string {
  const totalMinutes = slotToMinutes(slot);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function minutesFromDate(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
