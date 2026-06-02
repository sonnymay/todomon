// Thin wrapper over @capacitor/haptics. On the web (or if the plugin is unavailable) every
// call is a harmless no-op — wrapped in try/catch so haptics can never crash the UI.
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

export function tapLight(): void {
  try {
    void Haptics.impact({ style: ImpactStyle.Light })
  } catch {
    // not on a device / plugin missing — ignore
  }
}

export function success(): void {
  try {
    void Haptics.notification({ type: NotificationType.Success })
  } catch {
    // ignore
  }
}
