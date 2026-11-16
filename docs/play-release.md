# Google Play release plan (first release: free-only, Capacitor Android shell)

Decision (user, 16 Nov 2026): publish to Google Play before all curriculum content exists, then update the content
in later releases. The native app is a Capacitor shell around the existing web build (`dist/`), so content packs
ship inside the app and later content arrives with app updates.

## Scope of release 1

- Free study only. Purchase, restore, sign-in and the account screen are hidden when running natively
  (`src/app/platform.ts`, `PURCHASES_VISIBLE`). Google Play requires Play Billing for paid digital access; it is
  not implemented, so no paid pass is offered on Android. Units outside the free sample show "Later update".
- Content is whatever is **published** (reviewed) in `content/`. Drafts are never shipped. At the time of writing
  the published set is small; the store listing and in-app coverage map must say plainly that the syllabus is
  being added in stages. Do not describe the app as a complete CAIIB course.
- No exam-pass guarantee, no claim of IIBF endorsement. The app is independent.

## Repository state

- `capacitor.config.ts`: `appId` is a PLACEHOLDER (`app.caiibstudy.learn`). Choose the permanent package name
  before the first upload; it cannot change afterwards.
- `android/` is the generated Gradle project. Build outputs, `local.properties` and keystores are git-ignored.
- `npm run android:sync` builds the web app and copies it into the Android project.

## Verified build (16 Nov 2026)

`npm run android:sync`, then in `android/` with `JAVA_HOME` set to Android Studio's JBR
(`C:\Program Files\Android\Android Studio\jbr`, JDK 25) and `local.properties` containing
`sdk.dir=C:/Users/<you>/AppData/Local/Android/Sdk`: `gradlew assembleDebug` produced a 6.7 MB `app-debug.apk`.
The Gradle wrapper was raised to 9.1.0 because Capacitor 8 needs Java 21+ and Gradle 8.14 cannot run on JDK 25.
Not yet done: running the APK (no emulator or device was available) and the signed release bundle.

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
