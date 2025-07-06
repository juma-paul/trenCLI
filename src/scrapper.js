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
