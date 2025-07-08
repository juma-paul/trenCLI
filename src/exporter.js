import { promises as fs } from "fs";
import path from "path";

export async function saveToJSON(data, fileName) {
  const filePath = path.resolve(fileName);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  console.log(`Data saved to ${filePath}`);
}
