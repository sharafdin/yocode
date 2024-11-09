import { execSync } from "child_process";

export async function initializeGit(targetDir) {
  const { default: ora } = await import('ora'); // Dynamic import for ora
  const spinner = ora("Initializing Git repository...").start();
  try {
    execSync("git init", { cwd: targetDir });
    spinner.succeed("Initialized a new Git repository.");
  } catch (error) {
    spinner.fail("Failed to initialize Git repository.");
    throw error;
  }
}
