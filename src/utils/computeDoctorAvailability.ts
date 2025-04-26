import dayjs from "dayjs";

export function computeDoctorAvailability(isOnline: boolean, lastActive: Date | null, thresholdDays: number = 7): boolean {
  if (isOnline) return true; // Online doctors are available

  if (!lastActive) return false; // If there's no last active timestamp, assume unavailable

  const lastActiveThreshold = dayjs().subtract(thresholdDays, "days");
  
  return dayjs(lastActive).isAfter(lastActiveThreshold); // Check if within threshold
}

export function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();

  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

