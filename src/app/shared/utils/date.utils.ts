const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function formatDateTime(iso: string): string {
  const d   = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
  const day = d.getUTCDate().toString().padStart(2, '0');
  const mon = MONTHS[d.getUTCMonth()];
  const hr  = d.getUTCHours().toString().padStart(2, '0');
  const min = d.getUTCMinutes().toString().padStart(2, '0');
  return `${day} ${mon} ${hr}:${min}`;
}
