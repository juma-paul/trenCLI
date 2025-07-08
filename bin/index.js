import { program } from "commander";
import { WebScraper } from "../src/scrapper.js";
import { saveToCSV, saveToJSON } from "../src/exporter.js";
import { loadConfig } from "../src/config.js";
import { promises as fs } from "fs";

program.name("trencli").description("Terminal Web Scraper").version("1.0.0");

program
  .command("scrape")
  .description("Scrape data from web page(s)")
  .option("-u, --url <url>", "URL to scrape")
  .option("-f, --file <file>", "File with URLs")
  .option("-c, --config <file>", "JSON config file")
  .option("-o, --output <name>", "Output file name")
  .option("-t, --type <json|csv>", "Output format", "json")
  .option("-d, --delay <ms>", "Delay between requests", "1000")
  .action(async (options) => {
    try {
      let urls = [];
      let extractors = {};
      const outputName = options.output || "scraped-data";

      if (options.config) {
        const config = await loadConfig(options.config);
        urls = config.urls || [];
        extractors = config.extractors || {};
      }

      if (options.url) {
        urls = [options.url];
      } else if (options.file) {
        const fileContent = await fs.readFile(options.file, "utf-8");

        // Check if it's a JSON file
        if (options.file.endsWith(".json")) {
          const config = JSON.parse(fileContent);
          urls = config.urls || [];
          extractors = config.extractors || extractors;
        } else {
          // Plain text file with URLs
          urls = fileContent.split("\n").filter(Boolean);
        }
      }

      if (urls.length === 0) {
        console.error("No URLs provided.");
        process.exit(1);
      }

      if (Object.keys(extractors).length === 0) {
        extractors = {
          title: {
            selector: "title",
          },
          description: {
            selector: 'meta[name="description"]',
            attr: "content",
          },
          h1: {
            selector: "h1",
          },
          headings: {
            selector: "h1, h2, h3",
            multiple: true,
          },
          paragraphs: {
            selector: "p",
            multiple: true,
          },
          links: {
            selector: "a",
            attr: "href",
            multiple: true,
          },
          images: {
            selector: "img",
            attr: "src",
            multiple: true,
          },
          tableRows: {
            selector: "table tr",
            multiple: true,
          },
          listItems: {
            selector: "ul li, ol li",
            multiple: true,
          },
        };
      }

      const scraper = new WebScraper({ delay: parseInt(options.delay) });
      const results = await scraper.scrapeUrls(urls, extractors);

      if (options.type === "csv") {
        await saveToCSV(results, `${outputName}.csv`);
      } else {
        await saveToJSON(results, `${outputName}.json`);
      }

      console.log(`Scraped ${results.length} URLs successfully!`);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command("config")
  .description("Generate sample config")
  .option("-o, --output <file>", "Output config file", "scraper-config.json")
  .action(async (options) => {
    const sampleConfig = {
      urls: ["https://example.com", "https://httpbin.org/html"],
      extrctors: {
        title: { selector: "title" },
        description: { selector: 'meta[name="description"]', attr: "content" },
        headings: { selector: "h1, h2", multiple: true },
        links: { selector: "a", attr: "href", multiple: true },
      },
    };
    await fs.writeFile(options.output, JSON.stringify(sampleConfig, null, 2));
    console.log(`Sample config saved to ${options.output}`);
  });

program.parse();
