const fs = require("fs");
const path = require("path");
const { execSync, spawn } = require("child_process");

const services = [
  "auth-service",
  "main",
  "transaction-service",
  "wallet-service",
];

const rootDir = __dirname;

console.log("Preparing to start services...");

// 1. Copy .env.prod to .env
services.forEach((service) => {
  const servicePath = path.join(rootDir, service);
  const envProdPath = path.join(servicePath, ".env.prod");
  const envPath = path.join(servicePath, ".env");

  if (fs.existsSync(envProdPath)) {
    try {
      fs.copyFileSync(envProdPath, envPath);
      console.log(`[${service}] Copied .env.prod to .env`);
    } catch (err) {
      console.error(`[${service}] Failed to copy .env.prod:`, err.message);
    }
  } else {
    console.warn(`[${service}] .env.prod not found, skipping copy.`);
  }
});

// 2. Construct arguments for concurrently
// We use npx concurrently to run the commands in parallel
const commands = services.map((service) => ({
  command: "npm run dev",
  name: service,
  cwd: path.join(rootDir, service),
  prefixColor: getColorForService(service),
}));

// Helper to assign colors
function getColorForService(service) {
  const colors = ["blue", "green", "magenta", "cyan", "yellow", "red"];
  const index = services.indexOf(service);
  return colors[index % colors.length];
}

// Construct the concurrently command string
// concurrently "cmd1" "cmd2" ...
const concurrentlyArgs = commands
  .map((cmd) => {
    // Escape quotes if necessary, though simple strings usually work
    return `\"npm run dev --prefix ${cmd.name}\"`;
  })
  .join(" ");

// We need to run this from the root, so we use --prefix for each npm run
// But wait, `npm run dev --prefix auth-service` works from root.

console.log("\nStarting all services simultaneously...\n");

const finalCommand = `npx concurrently --kill-others-on-fail --prefix-colors "auto" --names "${services.join(
  ","
)}" ${concurrentlyArgs}`;

try {
  // Inherit stdio to show output in the terminal
  execSync(finalCommand, { stdio: "inherit", cwd: rootDir });
} catch (err) {
  // concurrently exits with non-zero if a command fails, which execSync throws
  console.error("Services stopped.");
}
