export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function createSessionId() {
  return createId("sess");
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function nowIso() {
  return new Date().toISOString();
}
