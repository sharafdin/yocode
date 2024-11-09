import { execSync } from "child_process";

export async function installPackages(targetDir, packageManager) {
  const { default: ora } = await import('ora'); // Dynamic import for ora
  const spinner = ora(`Installing dependencies with ${packageManager}...`).start();
  try {
    execSync(`${packageManager} install`, { cwd: targetDir, stdio: "inherit" });
    spinner.succeed("Dependencies installed successfully.");
  } catch (error) {
    spinner.fail(`Failed to install dependencies with ${packageManager}.`);
    throw error;
  }
}
