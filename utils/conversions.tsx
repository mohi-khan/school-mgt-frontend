import { format } from 'date-fns'

export const formatDate = (date: Date | null | undefined) => {
  if (!date) return '-'
  return format(new Date(date), 'MMM dd, yyyy')
}

export const formatNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return "-"

  const num = Number(value)
  if (isNaN(num)) return "-"

  return num.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

export const formatDateForInput = (dateStr: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
};

export function formatTime(time: string): string {
  const [h, m] = time.split(':')

  let hour = parseInt(h)
  const suffix = hour >= 12 ? 'PM' : 'AM'

  hour = hour % 12 || 12 // 0 → 12, 13 → 1, etc

  const hourStr = hour.toString().padStart(2, '0')

  return `${hourStr}:${m} ${suffix}`
}

