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
    this.rateLimiter = new RateLimiter(options.delay || 1000);
    this.userAgent = options.userAgent || "Mozilla/5.0";
    this.timeout = options.timeout || 10000;
    this.retries = options.retries || 3;
  }

  // Fetch a single page
  async fetchPage(url) {
    await this.rateLimiter.wait();

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const res = await axios.get(url, {
          headers: { "User-Agent": this.userAgent },
          timeout: this.timeout,
        });
        return res.data;
      } catch (err) {
        if (attempt === this.retries) throw err;
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
        } else if (rule.multiple) {
          result[key] = $(rule.selector)
            .map((i, el) => $(el).text().trim())
            .get();
        } else {
          result[key] = $(rule.selector).text().trim();
        }
      } catch {
        result[key] = null;
      }
    }
    return result;
  }
}
