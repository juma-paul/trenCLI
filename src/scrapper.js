import axios from "axios";
import * as cheerio from "cheerio";

class RateLimiter {
  constructor(delayMs = 1000) {
    const MIN_DELAY = 500;
    this.delayMs = Math.max(delayMs, MIN_DELAY);
    this.lastRequest = 0;
  }

  async wait() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;

    if (timeSinceLastRequest < this.delayMs) {
      await new Promise((res) =>
        setTimeout(res, this.delayMs - timeSinceLastRequest)
      );
    }

    this.lastRequest = Date.now();
  }
}

export class WebScraper {
  constructor(options = {}) {
    const userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36`;

    this.rateLimiter = new RateLimiter(options.delay || 1000);
    this.userAgent = options.userAgent || userAgent;
    this.timeout = options.timeout || 10000;
    this.retries = options.retries || 3;
  }

  // Fetch a single page
  async fetchPage(url) {
    await this.rateLimiter.wait();

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        console.log(`Fetching: ${url} (attempt ${attempt})`);

        const res = await axios.get(url, {
          headers: {
            "User-Agent": this.userAgent,
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          timeout: this.timeout,
        });
        return res.data;
      } catch (err) {
        console.log(`Attempt ${attempt} failed: ${err.message}`);

        if (attempt === this.retries) {
          throw new Error(
            `Failed to fetch ${url} after ${this.retries} attempts: ${err.message}`
          );
        }
        await new Promise((res) => setTimeout(res, 1000 * attempt));
      }
    }
  }

  extractData(html, extractors) {
    const $ = cheerio.load(html);
    const result = {};

    for (const [key, rule] of Object.entries(extractors)) {
      try {
        if (rule.attr) {
          result[key] = $(rule.selector).attr(rule.attr);
        } else if (rule.multiple && rule.cells) {
          // Special handling for table rows with cells
          result[key] = $(rule.selector)
            .map((i, row) => {
              const cells = $(row)
                .find("td, th")
                .map((j, cell) => $(cell).text().trim())
                .get();
              return cells;
            })
            .get();
        } else if (rule.multiple) {
          result[key] = $(rule.selector)
            .map((i, el) => $(el).text().trim())
            .get();
        } else {
          result[key] = $(rule.selector).text().trim();
        }
      } catch (err) {
        console.log(`Error extracting ${key}: ${err.message}`);
        result[key] = null;
      }
    }
    return result;
  }

  async scrapeUrls(urls, extractors) {
    const results = [];

    for (const url of urls) {
      try {
        const html = await this.fetchPage(url);
        const data = this.extractData(html, extractors);
        results.push({ ...data, url, scrapedAt: new Date().toLocaleString() });
      } catch (err) {
        console.error(`Error scraping ${url}: ${err.message}`);
        results.push({
          url,
          error: err.message,
          scrapedAt: new Date().toLocaleString(),
        });
      }
    }
    return results;
  }
}
