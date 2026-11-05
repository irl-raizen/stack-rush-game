export const DAILY_MISSION_REWARD = 30
export const DAILY_MISSION_TARGET = 3

export function missionKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`
}
