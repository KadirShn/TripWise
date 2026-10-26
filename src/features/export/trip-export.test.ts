import { demoExpenses, demoItineraryItems, demoMembers, demoTrips } from '@/constants/demo-data';
import { i18n } from '@/lib/i18n';
import type { TripBundle } from '@/types/domain';
import { buildExpensesCsv, buildTripReportHtml, exportFileName } from './trip-export';

const bundle: TripBundle = {
  trip: demoTrips[0],
  members: demoMembers,
  expenses: demoExpenses,
  itineraryItems: demoItineraryItems,
  settlements: [],
};

describe('trip export', () => {
  const t = i18n.getFixedT('tr');

  it('builds an Excel-friendly UTF-8 CSV with one row per expense', () => {
    const csv = buildExpensesCsv(bundle, t, 'tr');
    expect(csv.startsWith('﻿')).toBe(true);
    const lines = csv.trim().split('\r\n');
    expect(lines).toHaveLength(demoExpenses.length + 1);
    expect(lines[0]).toContain('Tarih;Harcama;Kategori;Ödeyen');
  });

  it('quotes cells that contain separators, quotes or newlines', () => {
    const tricky = {
      ...bundle,
      expenses: [{ ...demoExpenses[0], title: 'Kahve; "pasta"', notes: 'satır\nsonu' }],
    };
    const row = buildExpensesCsv(tricky, t, 'tr').trim().split('\r\n').slice(1).join('\r\n');
    expect(row).toContain('"Kahve; ""pasta"""');
    expect(row).toContain('"satır\nsonu"');
  });

  it('escapes user text in the PDF report', () => {
    const html = buildTripReportHtml(
      { ...bundle, expenses: [{ ...demoExpenses[0], title: '<script>x</script>' }] },
      t,
      'tr',
    );
    expect(html).not.toContain('<script>x');
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt;');
    expect(html).toContain('Ödeme planı');
  });

  it('creates ASCII file names from Turkish trip titles', () => {
    expect(exportFileName('Kapadokya Kaçamağı', 'csv')).toBe('tripwise-kapadokya-kacamagi.csv');
    expect(exportFileName('İstanbul · Şubat', 'pdf')).toBe('tripwise-istanbul-subat.pdf');
    expect(exportFileName('🎈', 'pdf')).toBe('tripwise-trip.pdf');
  });
});
