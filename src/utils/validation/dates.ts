export function isValidDateRange(startDate: string, endDate: string): boolean {
  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDate.test(startDate) || !isoDate.test(endDate)) return false;
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  return (
    !Number.isNaN(start.getTime()) &&
    !Number.isNaN(end.getTime()) &&
    start.toISOString().slice(0, 10) === startDate &&
    end.toISOString().slice(0, 10) === endDate &&
    start <= end
  );
}
