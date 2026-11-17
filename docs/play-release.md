# Google Play release plan (first release: free-only, Capacitor Android shell)

Decision (user, 16 Nov 2026): publish to Google Play before all curriculum content exists, then update the content
in later releases. The native app is a Capacitor shell around the existing web build (`dist/`), so content packs
ship inside the app and later content arrives with app updates.

## Scope of release 1

- Free study only. Purchase, restore, sign-in and the account screen are hidden when running natively
  (`src/app/platform.ts`, `PURCHASES_VISIBLE`). Google Play requires Play Billing for paid digital access; it is
  not implemented, so no paid pass is offered on Android. Units outside the free sample show "Later update".
- Content is whatever is **published** (reviewed) in `content/`. Drafts are never shipped. At the time of writing
  the published packs cover ABM, BFM and ABFM in part (see the listing); the store listing and in-app coverage map must say plainly that the syllabus is
  being added in stages. Do not describe the app as a complete CAIIB course.
- No exam-pass guarantee, no claim of IIBF endorsement. The app is independent.

## Repository state

- `capacitor.config.ts`: `appId` is `in.superrecall.caiib` (chosen by the owner; permanent once published).
- `android/` is the generated Gradle project. Build outputs, `local.properties` and keystores are git-ignored.
- `npm run android:sync` builds the web app and copies it into the Android project.

## Verified build (17 Nov 2026 — v1.0.4, versionCode 5)

Signed release bundle built with R8 code optimization and ProGuard obfuscation:
- Output: `android/app/build/outputs/bundle/release/app-release.aab` (4.76 MB)
- De-obfuscation mapping: `android/app/build/outputs/mapping/release/mapping.txt`
- Built using Android Studio JBR (JDK 25) with Gradle 9.1.0 and R8 `proguard-android-optimize.txt`.
- Includes all 5 published packs (`ABM@48`, `BFM@54`, `ABFM@6`, `BRBL@1`, `CB@1`, 8,395 items).

## Multi-Agent Release Synchronization Protocol (Claude, Codex, Antigravity)

To prevent version clashes in Google Play Console (such as "Version code X has already been used"):
1. **Monotonic Version Code**: Google Play strictly rejects re-uploads of existing version codes. Every agent cutting a release bundle MUST increment `versionCode` by at least +1 in `android/app/build.gradle` and bump `versionName`.
2. **Atomic Content Sync**: Always run `npm run build && npx cap copy android` before triggering Gradle, so all published content packs and updated manifest are packaged into `android/app/src/main/assets/public/content/`.
3. **R8 & ProGuard Preservation**: Ensure `minifyEnabled true`, `shrinkResources true`, and `proguard-rules.pro` remain active so Play Console DEX optimization and obfuscation checks pass.
4. **Log the Release**: Record the version code, bundle size, and git commit in this file and `PROJECT_STATE.md`.

## Remaining actions, in order

1. Owner: choose the package name and create a Google Play developer account (one-time registration fee; identity
   verification applies; new personal accounts must run a closed test with at least 12 testers for 14 days before
   production access, so start early).
2. Install Android Studio (or the SDK command line tools) and JDK 17, then `npm run android:sync` and open
   `android/` to build. `npm run android:bundle` produces the release `.aab` after signing is configured.
3. Create an upload keystore; keep it outside the repository and back it up. Enrol in Play App Signing.
4. Replace the default launcher icon (`android/app/src/main/res/mipmap-*`) with the app icon and add an adaptive
   icon from `public/icon-maskable.svg`.
5. Host a privacy policy at a public URL. State what is stored on the device (progress only, no account in
   release 1), that no data is sent off the device, and a support contact. Complete the Data safety form to match.
6. Complete the content rating questionnaire, target audience (adults), app category (Education), and the
   store listing (title, short and full description, 512 px icon, 1024x500 feature graphic, 2-8 phone screenshots).
7. Upload the `.aab` to an internal test track, then closed testing, then production.
8. Later: implement Play Billing (see `docs/specs/monetization.md`) and server-side purchase verification before
   any paid pass is shown on Android.

## Pre-upload verification checklist

- [ ] `npm run check` passes and the web build contains only published content.
- [ ] Install the debug build on a real device; airplane mode: lessons, practice and reviews work and progress
      survives a restart.
- [ ] No screen mentions payment, sign-in or "the pass" in the native build.
- [ ] Text scaling to 200% and TalkBack spot check on Today, Learn, Practice.
- [ ] Listing text matches the actual published content and coverage.
