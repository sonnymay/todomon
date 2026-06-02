# ToDoMon Pro IAP Setup

Native purchase code is wired through RevenueCat. Web/dev still uses the existing mock.

## Product

- Type: Non-consumable
- Product ID: `todomon_pro`
- Price: `$4.99`
- Bundle ID: `com.sonnymay.todomon`

## App Store Connect

1. Open App Store Connect.
2. Create/select the ToDoMon app with bundle ID `com.sonnymay.todomon`.
3. Add an in-app purchase:
   - Type: Non-consumable
   - Reference name: `ToDoMon Pro`
   - Product ID: `todomon_pro`
   - Price tier: `$4.99`
4. Fill review screenshot/metadata for the Pro unlock.
5. Attach the IAP to app version `1.0.0` before submission.

## RevenueCat

1. Create a RevenueCat project/app for ToDoMon iOS.
2. Connect App Store Connect credentials / in-app purchase key as RevenueCat requires.
3. Import or create product `todomon_pro`.
4. Create entitlement `pro`.
5. Attach product `todomon_pro` to entitlement `pro`.
6. Copy the RevenueCat iOS public SDK key.
7. Set it in `frontend/.env`:

```bash
VITE_REVENUECAT_IOS_API_KEY=<revenuecat_ios_public_sdk_key>
```

## Code Path

- `frontend/src/lib/iap.ts`
  - native purchase: RevenueCat `getProducts` + `purchaseStoreProduct`
  - native restore: RevenueCat `restorePurchases`
  - Pro unlock succeeds when:
    - `todomon_pro` appears in purchased product IDs, or
    - active entitlement `pro` exists

## Testing

1. Run:

```bash
cd frontend
npm run build
npm test
cd ..
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npm run cap:sync:ios
```

2. Test purchase on a real iOS device or StoreKit/TestFlight sandbox.
3. Verify:
   - Buy Pro unlocks premium cosmetics.
   - Buy Pro enables 2x coins.
   - Restore Purchases re-grants Pro after reinstall.
