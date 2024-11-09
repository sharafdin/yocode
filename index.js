#!/usr/bin/env node

const path = require("path");
const { getPrompts } = require("./lib/prompts");
const { generateFiles } = require("./lib/fileGenerator");
const { initializeGit } = require("./lib/gitInitializer");
const { installPackages } = require("./lib/packageInstaller");

async function main() {
  console.log(`
   🚀 Yocode - Your VS Code Extension Generator 🚀
   Ready to bring your extension ideas to life!
   `);

  const answers = await getPrompts();
  const targetDir = path.join(process.cwd(), answers.identifier);

  // Step 1: Generate all necessary files and folders
  await generateFiles(targetDir, answers);

  // Step 2: Initialize Git, if requested
  if (answers.gitInit) {
    try {
      await initializeGit(targetDir);
    } catch (error) {
      console.error("Failed to initialize Git repository:", error);
    }
  }

  // Step 3: Install dependencies using the specified package manager
  try {
    await installPackages(targetDir, answers.packageManager);
  } catch (error) {
    console.error(
      `Failed to install dependencies with ${answers.packageManager}:`,
      error
    );
  }

  // Final message after project setup is complete
  console.log(
    `🎉 Congratulations! Your project has been set up successfully in ${targetDir} 🎉`
  );
  console.log(
    "🚀 Time to start building your awesome extension! Happy coding! 🚀"
  );
}

main();
