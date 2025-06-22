# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

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

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Bible App Recent Changes
- "Hold to Try Another" option added to the Accounts Screen
- Refactor of colors and "light" mode added (toggle switch added to Accounts page)
- Increased height on the content container in the second and third tabs (since feedback is now an overlay)
- Context buttons that appear after correct answer is shown to allow user to navigate to next or previous chapter
- Reworked Enabled Books screen so that users can disable chapters in addition to books (long press now toggles books, short press expands books)
- All Bible chapters now have summaries!
- Feedback is now an overlay
- Feedback sounds have been replaced so that correct and incorrect are comparable in instrumentation and style
- Incorrect answers shake the screen
- Correct answers submitted on first try now display confetti
- Added an about page
- Changing the state of Enabled Books now automatically changes the Prompts on the Verses and Summaries tabs (and resets attempts to 0)
- Username of current user now displays in yellow on leaderboard
- On summaries tab, when correct answer is shown, the original prompt displays in yellow above the chapter text

## Bible App Upcoming Changes
- Potential rework of correct answer feedback (perhaps use confetti more sparingly)
- Forgot password system?

## Credits for Externally Produced Assets
- Hompage Bible Image: http://www.publicdomainfiles.com/show_file.php?id=13932879013386
- Feedback Audio:
  - Dat's Right! by Beetlemuse -- https://freesound.org/s/587252/ -- License: Attribution 4.0
  - Dat's Wrong! by Beetlemuse -- https://freesound.org/s/587253/ -- License: Attribution 4.0
