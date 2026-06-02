// Thin wrapper over @capacitor/haptics. On the web (or if the plugin is unavailable) every
// call is a harmless no-op — wrapped in try/catch so haptics can never crash the UI. Gated by
// a persisted preference so the user can turn vibration off.
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

const HAPTICS_KEY = 'todomon_haptics_v1'

export function isHapticsOn(): boolean {
  try {
    return localStorage.getItem(HAPTICS_KEY) !== '0'
  } catch {
    return true
  }
}

export function setHapticsOn(on: boolean): void {
  try {
    localStorage.setItem(HAPTICS_KEY, on ? '1' : '0')
  } catch {
    // storage unavailable — preference stays in-memory only
  }
}

export function tapLight(): void {
  if (!isHapticsOn()) return
  try {
    void Haptics.impact({ style: ImpactStyle.Light })
  } catch {
    // not on a device / plugin missing — ignore
  }
}

export function success(): void {
  if (!isHapticsOn()) return
  try {
    void Haptics.notification({ type: NotificationType.Success })
  } catch {
    // ignore
  }
}
