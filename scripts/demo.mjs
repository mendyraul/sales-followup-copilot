import { existsSync, copyFileSync } from "node:fs";
import { spawn } from "node:child_process";
import net from "node:net";
if (!existsSync(".env")) copyFileSync(".env.example", ".env");
process.loadEnvFile(".env");
// Demo runs never make paid provider calls, even if an operator configured a key.
process.env.AI_PROVIDER = "mock";
process.env.APP_MODE = "demo";
process.env.SEND_MODE = "manual";
const port = Number(process.env.PORT || 3115);
function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", env: process.env });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`)),
    );
  });
}
try {
  await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", () =>
      reject(
        new Error(
          `Port ${port} is already in use. Stop that server or set PORT in .env.`,
        ),
      ),
    );
    probe.listen(port, "127.0.0.1", () => probe.close(resolve));
  });
  await run("docker", ["compose", "up", "-d", "--wait", "db"]);
  await run("npm", ["run", "db:migrate"]);
  await run("npm", ["run", "db:seed"]);
  await run("npm", ["run", "build"]);
  console.log(
    `\nOpen http://127.0.0.1:${port} — mock drafts, sending disabled.\n`,
  );
  await run("npm", ["run", "start", "--", "--port", String(port)]);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
