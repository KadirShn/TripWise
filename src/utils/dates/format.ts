import { format, isValid, parseISO } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';

const localeFor = (language: string) => (language === 'en' ? enUS : tr);

export const parseDateOnly = (value: string) => parseISO(`${value}T12:00:00`);

export const formatDateOnly = (value: string, language: string) => {
  const date = parseDateOnly(value);
  if (!isValid(date)) return value;
  return format(date, language === 'en' ? 'MMMM d, yyyy' : 'd MMMM yyyy', {
    locale: localeFor(language),
  });
};

export const formatShortDate = (value: string, language: string) => {
  const date = parseDateOnly(value);
  if (!isValid(date)) return value;
  return format(date, language === 'en' ? 'MMM d' : 'd MMM', {
    locale: localeFor(language),
  });
};

export const formatDateTime = (value: string, language: string) => {
  const date = new Date(value);
  if (!isValid(date)) return value;
  return format(date, language === 'en' ? 'MMMM d, yyyy, HH:mm' : 'd MMMM yyyy, HH:mm', {
    locale: localeFor(language),
  });
};

export const formatTime = (value: string) => {
  const date = new Date(value);
  return isValid(date) ? format(date, 'HH:mm') : value;
};

export const calendarDateKey = (value: string | Date, timeZone?: string) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (!isValid(date)) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
};
