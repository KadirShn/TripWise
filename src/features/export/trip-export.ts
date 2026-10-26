import type { TFunction } from 'i18next';
import type { Expense, TripBundle } from '@/types/domain';
import { formatDateOnly, formatDateTime } from '@/utils/dates/format';
import { formatMinorForInput, formatMoney } from '@/utils/money/money';
import { calculateBalances, simplifySettlements } from '@/utils/settlement/balances';

const RATE_SCALE = 1_000_000;
// Semicolons keep decimal commas intact in Turkish-locale spreadsheet apps.
const CSV_SEPARATOR = ';';

export const baseAmountMinor = (expense: Expense) =>
  Math.round((expense.amountMinor * expense.exchangeRateMillionths) / RATE_SCALE);

const csvCell = (value: string) =>
  /[";\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export function exportFileName(title: string, extension: 'csv' | 'pdf') {
  const slug = title
    .toLocaleLowerCase('tr-TR')
    .replace(
      /[çğıöşü]/g,
      (char) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[char] ?? '',
    )
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `tripwise-${slug || 'trip'}.${extension}`;
}

const sortedExpenses = (bundle: TripBundle) =>
  [...bundle.expenses].sort(
    (a, b) => a.expenseDate.localeCompare(b.expenseDate) || a.createdAt.localeCompare(b.createdAt),
  );

export function buildExpensesCsv(bundle: TripBundle, t: TFunction, language: string): string {
  const name = (id: string) =>
    bundle.members.find((member) => member.id === id)?.displayName ?? '—';
  const base = bundle.trip.baseCurrency;
  const header = [
    t('export.columns.date'),
    t('export.columns.title'),
    t('export.columns.category'),
    t('export.columns.payer'),
    t('export.columns.amount'),
    t('export.columns.currency'),
    t('export.columns.rate'),
    `${t('export.columns.baseAmount')} (${base})`,
    t('export.columns.split'),
    t('export.columns.notes'),
  ];
  const rows = sortedExpenses(bundle).map((expense) => [
    formatDateOnly(expense.expenseDate, language),
    expense.title,
    t(`expenses.categories.${expense.category}`),
    name(expense.paidByMemberId),
    formatMinorForInput(expense.amountMinor, expense.currency),
    expense.currency,
    (expense.exchangeRateMillionths / RATE_SCALE).toFixed(6).replace('.', ','),
    formatMinorForInput(baseAmountMinor(expense), base),
    expense.splits
      .map(
        (split) =>
          `${name(split.memberId)}: ${formatMinorForInput(split.shareMinor, expense.currency)}`,
      )
      .join(', '),
    expense.notes ?? '',
  ]);
  // The BOM makes Excel detect UTF-8 so Turkish characters render correctly.
  return `﻿${[header, ...rows].map((row) => row.map(csvCell).join(CSV_SEPARATOR)).join('\r\n')}\r\n`;
}

export function buildTripReportHtml(bundle: TripBundle, t: TFunction, language: string): string {
  const { trip } = bundle;
  const base = trip.baseCurrency;
  const name = (id: string) =>
    bundle.members.find((member) => member.id === id)?.displayName ?? '—';
  const money = (amountMinor: number, currency = base) =>
    escapeHtml(formatMoney(amountMinor, currency));
  const expenses = sortedExpenses(bundle);
  const total = expenses.reduce((sum, expense) => sum + baseAmountMinor(expense), 0);
  const balances = calculateBalances(
    bundle.members.map((member) => member.id),
    bundle.expenses,
    bundle.settlements,
  );
  const transfers = simplifySettlements(balances);
  const payments = bundle.settlements.filter((settlement) => settlement.status === 'paid');
  const cell = (value: string, numeric = false) =>
    `<td${numeric ? ' class="num"' : ''}>${value}</td>`;
  const head = (...labels: string[]) =>
    `<tr>${labels.map((label) => `<th>${escapeHtml(label)}</th>`).join('')}</tr>`;

  const expenseRows = expenses
    .map(
      (expense) =>
        `<tr>${[
          cell(escapeHtml(formatDateOnly(expense.expenseDate, language))),
          cell(escapeHtml(expense.title)),
          cell(escapeHtml(t(`expenses.categories.${expense.category}`))),
          cell(escapeHtml(name(expense.paidByMemberId))),
          cell(money(expense.amountMinor, expense.currency), true),
          cell(money(baseAmountMinor(expense)), true),
        ].join('')}</tr>`,
    )
    .join('');
  const balanceRows = balances
    .map(
      (balance) =>
        `<tr>${cell(escapeHtml(name(balance.memberId)))}${cell(
          `${balance.balanceMinor > 0 ? '+' : balance.balanceMinor < 0 ? '−' : ''}${money(
            Math.abs(balance.balanceMinor),
          )}`,
          true,
        )}</tr>`,
    )
    .join('');
  const transferRows = transfers
    .map(
      (transfer) =>
        `<tr>${cell(escapeHtml(name(transfer.fromMemberId)))}${cell(
          escapeHtml(name(transfer.toMemberId)),
        )}${cell(money(transfer.amountMinor), true)}</tr>`,
    )
    .join('');
  const paymentRows = payments
    .map(
      (payment) =>
        `<tr>${cell(escapeHtml(name(payment.fromMemberId)))}${cell(
          escapeHtml(name(payment.toMemberId)),
        )}${cell(money(payment.amountMinor, payment.currency), true)}</tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="${language === 'en' ? 'en' : 'tr'}">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(t('export.reportTitle', { trip: trip.title }))}</title>
<style>
  body { font-family: -apple-system, Roboto, 'Segoe UI', sans-serif; color: #18243A; margin: 32px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 28px 0 8px; color: #0F766E; }
  p { margin: 2px 0; color: #4B5563; font-size: 12px; }
  .summary { display: flex; gap: 24px; margin-top: 16px; }
  .summary div { background: #ECFDF5; border-radius: 10px; padding: 10px 14px; }
  .summary strong { display: block; font-size: 16px; color: #18243A; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; background: #F1F5F9; padding: 6px 8px; }
  td { padding: 6px 8px; border-bottom: 1px solid #E5E7EB; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
</style>
</head>
<body>
  <h1>${escapeHtml(trip.coverEmoji)} ${escapeHtml(t('export.reportTitle', { trip: trip.title }))}</h1>
  <p>${escapeHtml(trip.destination)} · ${escapeHtml(formatDateOnly(trip.startDate, language))} — ${escapeHtml(
    formatDateOnly(trip.endDate, language),
  )}</p>
  <p>${escapeHtml(t('export.generatedAt', { date: formatDateTime(new Date().toISOString(), language) }))}</p>
  <div class="summary">
    <div>${escapeHtml(t('export.total'))}<strong>${money(total)}</strong></div>
    ${
      trip.budgetAmountMinor !== null
        ? `<div>${escapeHtml(t('export.budget'))}<strong>${money(trip.budgetAmountMinor)}</strong></div>`
        : ''
    }
  </div>
  <h2>${escapeHtml(t('expenses.title'))}</h2>
  ${
    expenses.length
      ? `<table>${head(
          t('export.columns.date'),
          t('export.columns.title'),
          t('export.columns.category'),
          t('export.columns.payer'),
          t('export.columns.amount'),
          `${t('export.columns.baseAmount')} (${base})`,
        )}${expenseRows}</table>`
      : `<p>${escapeHtml(t('export.noExpenses'))}</p>`
  }
  <h2>${escapeHtml(t('export.balances'))}</h2>
  <table>${head(t('export.columns.member'), t('export.columns.balance'))}${balanceRows}</table>
  <h2>${escapeHtml(t('export.settlements'))}</h2>
  ${
    transfers.length
      ? `<table>${head(t('export.columns.from'), t('export.columns.to'), t('export.columns.amount'))}${transferRows}</table>`
      : `<p>${escapeHtml(t('balances.settled'))}</p>`
  }
  ${
    payments.length
      ? `<h2>${escapeHtml(t('export.payments'))}</h2><table>${head(
          t('export.columns.from'),
          t('export.columns.to'),
          t('export.columns.amount'),
        )}${paymentRows}</table>`
      : ''
  }
  <p style="margin-top:28px">${escapeHtml(t('balances.shareFooter'))}</p>
</body>
</html>`;
}
