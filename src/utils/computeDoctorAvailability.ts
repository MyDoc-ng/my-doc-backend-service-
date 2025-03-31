import dayjs from "dayjs";

export function computeDoctorAvailability(isOnline: boolean, lastActive: Date | null, thresholdDays: number = 7): boolean {
  if (isOnline) return true; // Online doctors are available

  if (!lastActive) return false; // If there's no last active timestamp, assume unavailable

  const lastActiveThreshold = dayjs().subtract(thresholdDays, "days");
  
  return dayjs(lastActive).isAfter(lastActiveThreshold); // Check if within threshold
}
