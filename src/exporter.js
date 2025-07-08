import { promises as fs } from "fs";
import path from "path";

export async function saveToJSON(data, fileName) {
  const filePath = path.resolve(fileName);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  console.log(`Data saved to ${filePath}`);
}

export async function saveToCSV(data, filename) {
  if (data.length === 0) return;

  // Get column headers from first row
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];

  // Convert each data row to CSV format
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];

      // Handle null/undefined values
      if (value === null || value === undefined) return "";

      // Handle values that contain commas (wrap in quotes)
      if (typeof value === "string" && value.includes(",")) {
        return `"${value.replace(/"/g, '""')}"`;
      }

      return value;
    });
    csvRows.push(values.join(","));
  }

  const filepath = path.resolve(filename);
  await fs.writeFile(filepath, csvRows.join("\n"));
  console.log(`Data saved to ${filepath}`);
}
