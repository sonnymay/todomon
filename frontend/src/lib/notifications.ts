// "Dragon misses you" local notifications. Scheduled when the app goes to the background,
// cancelled when it returns — so only lapsed users ever see them. Wrapped in try/catch like
// haptics/sfx so the web build and missing-plugin cases are harmless no-ops. Gated by a
// persisted preference (Settings → Dragon reminders).
import { LocalNotifications } from '@capacitor/local-notifications'

const REMINDERS_KEY = 'todomon_reminders_v1'

// Fixed ids so re-scheduling replaces (never stacks) and cancel can target them.
const REMINDER_IDS = [9001, 9002]

export interface Reminder {
  hours: number // delay after the app is backgrounded
  title: string
  body: string
}

// Pure — the copy is in the pet's voice, escalating gently. Testable without Capacitor.
export function reminderMessages(petName: string): Reminder[] {
  return [
    {
      hours: 24,
      title: `🐉 ${petName} misses you!`,
      body: `One tiny task = one happy dragon. ${petName} is waiting.`,
    },
    {
      hours: 72,
      title: `🥺 ${petName} is getting really hungry…`,
      body: `It's been a few days. Come finish something small together?`,
    },
  ]
}

export function isRemindersOn(): boolean {
  try {
    return localStorage.getItem(REMINDERS_KEY) !== '0'
  } catch {
    return true
  }
}

export function setRemindersOn(on: boolean): void {
  try {
    localStorage.setItem(REMINDERS_KEY, on ? '1' : '0')
  } catch {
    // storage unavailable — preference stays in-memory only
  }
  if (!on) void clearReminders()
}

// Ask iOS for notification permission. Called at the end of onboarding (the moment of max
// attachment) rather than at app launch. Safe to call repeatedly — iOS only prompts once.
export async function requestPermission(): Promise<void> {
  try {
    await LocalNotifications.requestPermissions()
  } catch {
    // web / plugin missing — ignore
  }
}

export async function scheduleReminders(petName: string): Promise<void> {
  if (!isRemindersOn()) return
  try {
    const perm = await LocalNotifications.checkPermissions()
    if (perm.display !== 'granted') return
    const now = Date.now()
    await LocalNotifications.schedule({
      notifications: reminderMessages(petName).map((m, i) => ({
        id: REMINDER_IDS[i],
        title: m.title,
        body: m.body,
        schedule: { at: new Date(now + m.hours * 60 * 60 * 1000) },
      })),
    })
  } catch {
    // web / plugin missing — ignore
  }
}

export async function clearReminders(): Promise<void> {
  try {
    await LocalNotifications.cancel({
      notifications: REMINDER_IDS.map((id) => ({ id })),
    })
  } catch {
    // web / plugin missing — ignore
  }
}
