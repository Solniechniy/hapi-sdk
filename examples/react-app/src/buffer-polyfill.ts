/**
 * Buffer polyfill for browser environments
 *
 * This file provides a polyfill for the Node.js Buffer class in browser environments.
 * It should be imported at the entry point of your application.
 */

import { Buffer as BufferPolyfill } from "buffer";

// Make Buffer available globally for browser environments
if (typeof window !== "undefined" && typeof window.Buffer === "undefined") {
  (window as any).Buffer = BufferPolyfill;
}

export { BufferPolyfill as Buffer };
