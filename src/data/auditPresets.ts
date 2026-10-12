export interface AuditPreset {
  id: string;
  label: string;
  query: string;
  city: string;
}

export const AUDIT_PRESETS: AuditPreset[] = [
  {
    id: 'chip-pfc',
    label: 'Prestige Falcon City',
    query: 'Prestige Falcon City',
    city: 'Bengaluru',
  },
  {
    id: 'chip-sda',
    label: 'Sobha Dream Acres',
    query: 'Sobha Dream Acres',
    city: 'Bengaluru',
  },
  {
    id: 'chip-dlf',
    label: 'DLF Phase 5 (Gurgaon)',
    query: 'DLF Phase 5',
    city: 'Gurgaon',
  },
  {
    id: 'chip-fc',
    label: 'Forest County (Pune)',
    query: 'Forest County',
    city: 'Pune',
  },
];
