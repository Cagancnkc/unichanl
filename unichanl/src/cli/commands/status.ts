import { request } from "undici";
import { loadConfig } from "../../config/config-manager.js";

interface StatusPayload {
  gateway: { status: string; address: string };
  providers: Array<{ name: string; configured: boolean }>;
  routing: { mode: string; default: string };
}

export async function statusCommand(): Promise<void> {
  const cfg = loadConfig();
  const url = `http://${cfg.gateway.host}:${cfg.gateway.port}/status`;
  try {
    const res = await request(url, { method: "GET" });
    if (res.statusCode !== 200) {
      process.stdout.write(
        `UNICHANL\n\nGateway       ERROR (${res.statusCode})\n`
      );
      process.exit(1);
    }
    const data = (await res.body.json()) as StatusPayload;
    printStatus(data);
  } catch {
    process.stdout.write(
      `UNICHANL\n\nGateway       NOT RUNNING\nAddress       ${cfg.gateway.host}:${cfg.gateway.port}\n\nRun \`unichanl start\` to launch the gateway.\n`
    );
    process.exit(1);
  }
}

function printStatus(data: StatusPayload): void {
  const lines = [
    "",
    "UNICHANL",
    "",
    `Gateway       ${data.gateway.status.toUpperCase()}`,
    `Address       ${data.gateway.address}`,
    "",
    "Providers",
    "",
  ];
  for (const p of data.providers) {
    lines.push(
      `${p.name.padEnd(14)}${p.configured ? "CONFIGURED" : "NOT CONFIGURED"}`
    );
  }
  lines.push(
    "",
    `Routing       ${data.routing.mode.toUpperCase()} (default: ${data.routing.default})`,
    ""
  );
  process.stdout.write(lines.join("\n") + "\n");
}
