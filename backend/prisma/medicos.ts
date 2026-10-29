/**
 * Transcrição estruturada de dados/medicos.md (texto livre para humanos).
 * Cada linha espelha uma linha das tabelas do arquivo original.
 */

/** 0 = domingo … 6 = sábado (mesma convenção de Date#getDay). Nenhum médico atende aos domingos. */
const [SEG, TER, QUA, QUI, SEX, SAB] = [1, 2, 3, 4, 5, 6];

export interface TurnoSemanal {
  dias: number[];
  inicio: string;
  fim: string;
}

export interface MedicoDoCatalogo {
  id: number;
  nome: string;
  crm: string;
  turnos: TurnoSemanal[];
}

export const MEDICOS: MedicoDoCatalogo[] = [
  {
    id: 1,
    nome: 'Dra. Helena Marques',
    crm: 'CRM-MG 11111',
    turnos: [
      { dias: [SEG, TER, QUA, QUI, SEX], inicio: '08:00', fim: '12:00' },
      { dias: [SEG, TER, QUA, QUI, SEX], inicio: '14:00', fim: '18:00' },
    ],
  },
  {
    id: 2,
    nome: 'Dr. Rafael Teixeira',
    crm: 'CRM-MG 22222',
    turnos: [
      { dias: [SEG, QUA, SEX], inicio: '07:00', fim: '13:00' },
      { dias: [TER, QUI], inicio: '13:00', fim: '19:00' },
    ],
  },
  {
    id: 3,
    nome: 'Dra. Beatriz Nogueira',
    crm: 'CRM-MG 33333',
    turnos: [
      { dias: [SEG, TER, QUA, QUI], inicio: '09:00', fim: '12:00' },
      { dias: [SEG, TER, QUA, QUI], inicio: '18:00', fim: '22:00' },
    ],
  },
  {
    id: 4,
    nome: 'Dr. Thiago Fontes',
    crm: 'CRM-MG 44444',
    turnos: [
      { dias: [TER, QUA, QUI, SEX, SAB], inicio: '08:00', fim: '12:00' },
      { dias: [QUA, SEX], inicio: '19:00', fim: '22:00' },
    ],
  },
  {
    id: 5,
    nome: 'Dra. Camila Andrade',
    crm: 'CRM-MG 55555',
    turnos: [
      { dias: [SEG, TER, QUA, QUI, SEX], inicio: '10:00', fim: '14:00' },
      { dias: [SAB], inicio: '08:00', fim: '12:00' },
    ],
  },
];
