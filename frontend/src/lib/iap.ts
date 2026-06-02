import type {
  CustomerInfo,
  PurchasesPlugin,
} from '@revenuecat/purchases-capacitor'

// In-app purchase entitlement for "ToDoMon Pro" (one-time, non-consumable).
//
// The entitlement (isPro) is cached in localStorage for instant gating. On web/dev the
// purchase is mocked so the whole flow is testable in the browser. On a real iOS build
// RevenueCat wraps StoreKit for product `todomon_pro`.

export const PRO_PRODUCT_ID = 'todomon_pro'
export const PRO_PRICE_DISPLAY = '$4.99'
export const PRO_ENTITLEMENT_ID = 'pro'

const KEY = 'todomon_pro_v1'
const REVENUECAT_IOS_API_KEY = import.meta.env.VITE_REVENUECAT_IOS_API_KEY

let purchasesPromise: Promise<PurchasesPlugin | null> | null = null

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

function hasProEntitlement(customerInfo: CustomerInfo): boolean {
  return (
    PRO_PRODUCT_ID in customerInfo.allPurchaseDates ||
    customerInfo.allPurchasedProductIdentifiers.includes(PRO_PRODUCT_ID) ||
    !!customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] ||
    !!customerInfo.entitlements.active[PRO_PRODUCT_ID]
  )
}

async function getPurchases(): Promise<PurchasesPlugin | null> {
  if (!isNative()) return null
  if (!REVENUECAT_IOS_API_KEY) {
    console.warn(
      'Missing VITE_REVENUECAT_IOS_API_KEY. Native ToDoMon Pro purchase disabled.',
    )
    return null
  }
  if (!purchasesPromise) {
    purchasesPromise = import('@revenuecat/purchases-capacitor').then(
      async ({ Purchases }) => {
        await Purchases.configure({
          apiKey: REVENUECAT_IOS_API_KEY,
          appUserID: null,
          diagnosticsEnabled: false,
        })
        return Purchases
      },
    )
  }
  return purchasesPromise
}

// ── Native StoreKit via RevenueCat ─────────────────────────────────────────────────────────
async function nativePurchase(): Promise<boolean> {
  const purchases = await getPurchases()
  if (!purchases) return false
  try {
    const { PRODUCT_CATEGORY } = await import('@revenuecat/purchases-capacitor')
    const { products } = await purchases.getProducts({
      productIdentifiers: [PRO_PRODUCT_ID],
      type: PRODUCT_CATEGORY.NON_SUBSCRIPTION,
    })
    const product = products.find((p) => p.identifier === PRO_PRODUCT_ID)
    if (!product) {
      console.warn(`RevenueCat product not found: ${PRO_PRODUCT_ID}`)
      return false
    }
    const result = await purchases.purchaseStoreProduct({ product })
    return hasProEntitlement(result.customerInfo)
  } catch (err) {
    console.error('ToDoMon Pro purchase failed', err)
    return false
  }
}

async function nativeRestore(): Promise<boolean> {
  const purchases = await getPurchases()
  if (!purchases) return false
  try {
    const { customerInfo } = await purchases.restorePurchases()
    return hasProEntitlement(customerInfo)
  } catch (err) {
    console.error('ToDoMon Pro restore failed', err)
    return false
  }
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
