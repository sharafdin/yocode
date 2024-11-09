import path from "path";
import { fileURLToPath } from "url";
import ejs from "ejs";
import fs from "fs";
import { fetchLatestVersion } from "./versionFetcher.js";

// Helper to resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to fetch and store the latest versions
async function getLatestVersions() {
  const dependencies = [
    "@types/vscode",
    "@types/mocha",
    "@types/node",
    "@typescript-eslint/eslint-plugin",
    "@typescript-eslint/parser",
    "eslint",
    "typescript",
    "@vscode/test-cli",
    "@vscode/test-electron",
  ];

  const versions = {};
  for (const dep of dependencies) {
    versions[dep] = (await fetchLatestVersion(dep)) || "1.0.0";
  }
  return versions;
}

// Helper function to format dependencies with the fetched version
function dep(packageName, versions) {
  const version = versions[packageName] || "1.0.0";
  return `"${packageName}": "^${version}"`;
}

export async function generateFiles(targetDir, answers) {
  const { default: ora } = await import("ora"); // Dynamic import for ora
  const spinner = ora("Generating files...\n").start();

  try {
    const templateDir = path.join(__dirname, "../templates");
    const latestVersions = await getLatestVersions();
    const languageDir =
      answers.languageType === "TypeScript" ? "TypeScript" : "JavaScript";
    const languageTemplateDir = path.join(templateDir, languageDir);

    const files = [
      { template: "README.md.ejs", target: "README.md" },
      { template: "package.json.ejs", target: "package.json" },
      { template: "CHANGELOG.md.ejs", target: "CHANGELOG.md" },
      {
        template: ".vscode/extensions.json.ejs",
        target: ".vscode/extensions.json",
      },
      { template: ".vscode/launch.json.ejs", target: ".vscode/launch.json" },
      { template: ".vscodeignore.ejs", target: ".vscodeignore" },
      { template: "gitignore.ejs", target: ".gitignore" },
      {
        template: "vsc-extension-quickstart.md.ejs",
        target: "vsc-extension-quickstart.md",
      },
    ];

    if (languageDir === "TypeScript") {
      files.push(
        { template: "tsconfig.json.ejs", target: "tsconfig.json" },
        { template: "src/extension.ts.ejs", target: "src/extension.ts" },
        {
          template: "src/test/extension.test.ts.ejs",
          target: "src/test/extension.test.ts",
        },
        {
          template: ".vscode/settings.json.ejs",
          target: ".vscode/settings.json",
        },
        { template: ".vscode/tasks.json.ejs", target: ".vscode/tasks.json" },
        { template: ".npmrc-pnpm.ejs", target: ".npmrc-pnpm" },
        { template: ".yarnrc.ejs", target: ".yarnrc" },
        { template: "eslint.config.mjs.ejs", target: "eslint.config.mjs" }
      );
    } else {
      files.push(
        { template: "jsconfig.json.ejs", target: "jsconfig.json" },
        { template: "src/extension.js.ejs", target: "src/extension.js" },
        { template: ".vscode-test.mjs.ejs", target: ".vscode-test.mjs" },
        { template: ".npmrc-pnpm.ejs", target: ".npmrc-pnpm" },
        { template: ".yarnrc.ejs", target: ".yarnrc" },
        { template: "eslint.config.mjs.ejs", target: "eslint.config.mjs" },
        {
          template: "test/extension.test.js.ejs",
          target: "test/extension.test.js",
        }
      );
    }

    const folders = [
      ".vscode",
      languageDir === "TypeScript" ? "src/test" : "test",
      "src",
    ];

    folders.forEach((folder) => {
      const folderPath = path.join(targetDir, folder);
      fs.mkdirSync(folderPath, { recursive: true });
      spinner.text = `Created folder: ${folderPath}`;
    });

    for (const file of files) {
      const templatePath = path.join(languageTemplateDir, file.template);
      const targetPath = path.join(targetDir, file.target);

      const content = await ejs.renderFile(templatePath, {
        name: answers.identifier,
        displayName: answers.displayName,
        description: answers.description || "No description provided.",
        vsCodeEngine: "^1.60.0",
        pkgManager: answers.packageManager,
        checkJavaScript: answers.jsTypeChecking,
        versions: latestVersions,
        dep: (pkg) => dep(pkg, latestVersions),
      });

      fs.writeFileSync(targetPath, content);
      spinner.text = `Created file: ${targetPath}`;
      await new Promise((resolve) => setTimeout(resolve, 100)); // Delay for smooth transition
    }

    spinner.succeed("Files generated successfully!");
  } catch (error) {
    spinner.fail("Failed to generate files.");
    throw error;
  }
}
