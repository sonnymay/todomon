// In-app purchase entitlement for "ToDoMon Pro" (one-time, non-consumable).
//
// The entitlement (isPro) is cached in localStorage for instant gating. On web/dev the
// purchase is MOCKED so the whole flow is testable in the browser. On a real iOS build the
// `nativePurchase`/`nativeRestore` seams below must be wired to StoreKit (via a Capacitor IAP
// plugin or RevenueCat) — see docs/SHIP_PLAN.md §B. Until then they no-op on device.

export const PRO_PRODUCT_ID = 'todomon_pro'
export const PRO_PRICE_DISPLAY = '$4.99'

const KEY = 'todomon_pro_v1'

export function isPro(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

function setPro(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? '1' : '0')
  } catch {
    // storage unavailable — entitlement stays in-memory only
  }
}

// True when running inside the native Capacitor shell (vs a plain browser).
function isNative(): boolean {
  return typeof (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
    ?.isNativePlatform === 'function'
    ? (window as unknown as { Capacitor: { isNativePlatform: () => boolean } }).Capacitor.isNativePlatform()
    : false
}

// ── Native seams (wire to StoreKit during the on-device IAP step) ───────────────────────────
async function nativePurchase(): Promise<boolean> {
  // TODO(native): call the StoreKit plugin to purchase PRO_PRODUCT_ID, verify the receipt,
  // and resolve true on success. Returns false until wired.
  return false
}

async function nativeRestore(): Promise<boolean> {
  // TODO(native): query StoreKit for an existing PRO_PRODUCT_ID entitlement.
  return false
}

// Purchase flow. Resolves true if the user is Pro afterward.
export async function purchasePro(): Promise<boolean> {
  if (isNative()) {
    const ok = await nativePurchase()
    if (ok) setPro(true)
    return ok
  }
  // Web/dev mock: grant immediately so the UX is fully testable.
  setPro(true)
  return true
}

export async function restorePurchases(): Promise<boolean> {
  if (isNative()) {
    const ok = await nativeRestore()
    if (ok) setPro(true)
    return ok
  }
  return isPro()
}
