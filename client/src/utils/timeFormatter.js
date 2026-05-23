export function formatDurationHours(value) {
  if (value === null || value === undefined || value === "") {
    return "--"
  }

  const hours = Number(value)
  if (Number.isNaN(hours)) {
    return "--"
  }

  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60

  if (h === 0 && m === 0) {
    return "0h"
  }

  if (m === 0) {
    return `${h}h`
  }

  return `${h}h ${m}min`
}
