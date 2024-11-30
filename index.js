#!/usr/bin/env node

import fs from "fs"; // Import fs to interact with the filesystem
import { Command } from "commander"; // Import Commander.js for CLI functionality
import path from "path";
import { getPrompts } from "./lib/prompts.js";
import { generateFiles } from "./lib/fileGenerator.js";
import { initializeGit } from "./lib/gitInitializer.js";
import { installPackages } from "./lib/packageInstaller.js";
import { generateCommand } from "./lib/generateCommand.js"; // Function for command scaffolding

const program = new Command();

// Display the Yocode banner
console.log(`
   🚀 Yocode - Your VS Code Extension Generator 🚀
`);

// `yocode init` command to initialize a new project
program
  .command("init")
  .description("Initialize a new VS Code extension project")
  .action(async () => {
    const answers = await getPrompts();
    const targetDir = path.join(process.cwd(), answers.identifier);

    // Step 1: Generate files
    await generateFiles(targetDir, answers);

    // Step 2: Initialize Git
    if (answers.gitInit) {
      try {
        await initializeGit(targetDir);
      } catch (error) {
        console.error("Failed to initialize Git repository:", error);
      }
    }

    // Step 3: Install dependencies
    try {
      await installPackages(targetDir, answers.packageManager);
    } catch (error) {
      console.error(
        `Failed to install dependencies with ${answers.packageManager}:`,
        error
      );
    }

    // Success message
    console.log(
      `🎉 Congratulations! Your project has been set up successfully in ${targetDir} 🎉`
    );
    console.log("🚀 Time to start building your awesome extension! 🚀");
  });

// `yocode generate:command <commandName>` to scaffold a new command
program
  .command("generate:command <commandName>")
  .description("Generate a new command in the current project")
  .action(async (commandName) => {
    const targetDir = process.cwd(); // Use the current working directory
    const packageJsonPath = path.join(targetDir, "package.json");

    // Check if the command is being run inside a valid Yocode project
    if (!fs.existsSync(packageJsonPath)) {
      console.error(
        "❌ Error: package.json not found. Please run this command inside a Yocode project."
      );
      return;
    }

    // Detect the language type from package.json
    let languageType = "JavaScript"; // Default to JavaScript
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      if (packageJson.devDependencies?.typescript) {
        languageType = "TypeScript";
      }
    } catch (error) {
      console.error("❌ Error reading package.json:", error.message);
      return;
    }

    try {
      await generateCommand(commandName, languageType, targetDir);
    } catch (error) {
      console.error(
        `❌ Failed to generate the command "${commandName}": ${error.message}`
      );
    }
  });

// Parse CLI arguments
program.parse(process.argv);


// spinner.succeed('Files generated successfully!');
