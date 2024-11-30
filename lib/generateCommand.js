// Import required modules
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ejs from "ejs";

// Define __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateCommand(commandName, languageType, targetDir) {
  const { default: ora } = await import("ora"); // Dynamic import for ora

  const spinner = ora("Starting command generation...").start();
  try {
    const commandsDir = languageType === "TypeScript"
      ? path.join(targetDir, "src/commands")
      : path.join(targetDir, "commands");

    const commandFileName = `${commandName}.${
      languageType === "TypeScript" ? "ts" : "js"
    }`;
    const commandFilePath = path.join(commandsDir, commandFileName);
    const functionName = `execute${
      commandName.charAt(0).toUpperCase() + commandName.slice(1)
    }`;

    // Step 1: Fetch project prefix dynamically from package.json
    const packageJsonPath = path.join(targetDir, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      spinner.fail(`package.json not found at ${packageJsonPath}`);
      return;
    }
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const commandPrefix = packageJson.name || "extension";

    // Step 2: Generate the command file using EJS template
    spinner.text = "Generating command file...";
    if (!fs.existsSync(commandsDir)) {
      fs.mkdirSync(commandsDir, { recursive: true });
    }
    const commandTemplatePath = path.join(
      __dirname,
      "../templates/command.ejs"
    );
    const commandContent = await ejs.renderFile(commandTemplatePath, {
      commandName,
      functionName,
      languageType,
    });
    fs.writeFileSync(commandFilePath, commandContent, "utf-8");

    // Step 3: Update the extension file
    spinner.text = "Updating extension file...";
    const extensionFilePath = languageType === "TypeScript"
      ? path.join(targetDir, "src/extension.ts")
      : path.join(targetDir, "extension.js");

    if (!fs.existsSync(extensionFilePath)) {
      spinner.fail(`Extension file not found at ${extensionFilePath}`);
      return;
    }

    let extensionContent = fs.readFileSync(extensionFilePath, "utf-8");

    // Insert the command import
    const commandImport = languageType === "TypeScript"
      ? `import { ${functionName} } from './commands/${commandName}';`
      : `const { ${functionName} } = require('./commands/${commandName}');`;

    if (!extensionContent.includes(commandImport)) {
      const vscodeImportPosition = extensionContent.indexOf(
        "import * as vscode from"
      );
      const nextLineIndex = extensionContent.indexOf(
        "\n",
        vscodeImportPosition
      );
      extensionContent =
        extensionContent.slice(0, nextLineIndex + 1) +
        commandImport +
        "\n" +
        extensionContent.slice(nextLineIndex + 1);
    }

    // Add the command registration logic and consolidate subscriptions
    const subscriptionsMarker = "context.subscriptions.push(";
    const commandRegistration = languageType === "TypeScript"
      ? `const ${commandName}Command = vscode.commands.registerCommand('${commandPrefix}.${commandName}', ${functionName});`
      : `const ${commandName}Command = vscode.commands.registerCommand('${commandPrefix}.${commandName}', ${functionName});`;

    if (extensionContent.includes(subscriptionsMarker)) {
      // Modify the consolidated push block
      const openParenIndex = extensionContent.indexOf(
        "(",
        extensionContent.indexOf(subscriptionsMarker)
      );
      const closeParenIndex = extensionContent.indexOf(")", openParenIndex);

      // Extract and append new command
      const existingCommands = extensionContent
        .slice(openParenIndex + 1, closeParenIndex)
        .trim();
      const updatedCommands = existingCommands
        ? `${existingCommands}, ${commandName}Command`
        : `${commandName}Command`;

      extensionContent =
        extensionContent.slice(0, openParenIndex + 1) +
        ` ${updatedCommands} ` +
        extensionContent.slice(closeParenIndex);

      // Add the command declaration just above the consolidated subscriptions.push
      const declarationInsertIndex =
        extensionContent.indexOf(subscriptionsMarker);
      extensionContent =
        extensionContent.slice(0, declarationInsertIndex) +
        `${commandRegistration}\n` +
        extensionContent.slice(declarationInsertIndex);

      // Ensure two lines are added after the push block
      const subscriptionsEndIndex =
        extensionContent.indexOf(";", closeParenIndex) + 1;
      extensionContent =
        extensionContent.slice(0, subscriptionsEndIndex) +
        `\n\n` +
        extensionContent.slice(subscriptionsEndIndex);
    } else {
      // Create a new consolidated push block
      const activateFunctionStart = extensionContent.indexOf(
        "export function activate(context"
      );
      const activateFunctionBody =
        extensionContent.indexOf("{", activateFunctionStart) + 1;

      extensionContent =
        extensionContent.slice(0, activateFunctionBody) +
        `\n    ${commandRegistration}` +
        `\n    context.subscriptions.push(${commandName}Command);\n\n` +
        extensionContent.slice(activateFunctionBody);
    }

    fs.writeFileSync(extensionFilePath, extensionContent, "utf-8");

    // Step 4: Update package.json
    spinner.text = "Updating package.json...";
    packageJson.contributes = packageJson.contributes || {};
    packageJson.contributes.commands = packageJson.contributes.commands || [];
    packageJson.contributes.commands.push({
      command: `${commandPrefix}.${commandName}`,
      title: `${commandName} Command`,
    });
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2),
      "utf-8"
    );

    // Final success message
    spinner.succeed(`🎉 Command "${commandName}" successfully added!`);
  } catch (error) {
    spinner.fail("An error occurred during command generation.");
    console.error(error);
  }
}
