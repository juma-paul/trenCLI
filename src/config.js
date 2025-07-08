import { promises as fs } from "fs";

export async function loadConfig(path) {
  try {
    const configData = await fs.readFile(path, "utf-8");
    return JSON.parse(configData);
  } catch (err) {
    console.error(`Failed to load config: ${err.message}`);
    process.exit(1);
  }
}
