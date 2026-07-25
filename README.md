# Bible Review App

This is a mobile app designed to test your knowledge of where different events and verses can be find throughout the Bible.

<img width="270" height="600" alt="Screenshot_20260725-101926" src="https://github.com/user-attachments/assets/0baf7dc0-b694-4940-a135-c0a82fa624ec" />
<img width="270" height="600" alt="Screenshot_20260725-101635" src="https://github.com/user-attachments/assets/592c67c2-902a-401b-b96b-8c3f92f41141" />
<img width="270" height="600" alt="Screenshot_20260725-102220" src="https://github.com/user-attachments/assets/d9646c7e-1831-4628-95ab-7a171ddc669c" />
<img width="270" height="600" alt="Screenshot_20260725-102713" src="https://github.com/user-attachments/assets/6d617cab-eacc-46c3-a0e3-6de9e2b2e3d2" />

<img width="270" height="600" alt="Screenshot_20260725-102444" src="https://github.com/user-attachments/assets/e50d0e59-2c42-488c-bd0d-82aaa7b53cf5" />
<img width="270" height="600" alt="Screenshot_20260725-102523" src="https://github.com/user-attachments/assets/abd896dc-a2a7-4f12-8c4f-2c7e73606d50" />
<img width="270" height="600" alt="Screenshot_20260725-103110" src="https://github.com/user-attachments/assets/03b0090d-545a-4930-90e1-e8109c5311f4" />
<img width="270" height="600" alt="Screenshot_20260725-103537" src="https://github.com/user-attachments/assets/d1cc51ee-898d-444c-8d58-18df0a1eb314" />

## Getting Started

This is currently an Android only app, but future support for iPhone is expected.

To use the app, download the latest APK from the releases.

If you want to know more about the features of the app, check out the latest [User Manual](./Review_App_Specs_User_Guide.pdf)

## Bible App Recent Changes
- The Verses screen now accepts multiple correct answers for verses that appear in multiple different Bible chapters

## Bible App Upcoming Changes
- Forgot password system
- Potential rework of correct answer feedback (perhaps use confetti more sparingly)

## Privacy Policy
**What information do we collect?**
When you create an account in our app, we collect the following information:
- Email address (used for authentication, account security, communication)
- Username and password (used to identify and secure your account)

**How might we use your information?**
- To authenticate and manage your account
- To send you important app-related updates (e.g., password resets or verification emails)
- To maintain app security and improve your experience

**Do we share your information?**
- No. We do not share your email or personal information with third parties without your consent.
- Your email is only visible to app administrators and is never shown publicly.
- Your username is displayed in app to other app users on the leaderboard 

**How do we protect your information?**
- Your data is stored securely in our backend database (Supabase).
- We take reasonable measures to protect it from unauthorized access.

**Account Deletion**
- You can delete your account at any time by using in-app account settings.

## Credits for Externally Produced Assets
- Homepage Bible Image: http://www.publicdomainfiles.com/show_file.php?id=13932879013386
- Feedback Audio (Piano sound effects):
  - **"Dat's Right!"** by [Beetlemuse](https://freesound.org/s/587252/) Licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
  - **"Dat's Wrong!"** by [Beetlemuse](https://freesound.org/s/587253/) Licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
 
## For Developers

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

### Unit tests

Tests are **colocated** next to the module they cover:

```
utils/randomChapter.ts
utils/randomChapter.test.ts

components/ui/Button.tsx
components/ui/Button.test.tsx
```

- Prefer `*.test.ts` / `*.test.tsx` (not `*-test.tsx`).
- Optional: a local `__tests__/` folder is fine for crowded directories.
- Prefer testing pure `utils/` and extracted helpers first; screen/route tests last.
- Run with `npm test` (Jest + `jest-expo`). Shared mocks live in `jest.setup.ts`.

### Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

