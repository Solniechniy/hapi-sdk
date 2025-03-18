# HAPI TON SDK Examples

This directory contains examples of using the HAPI TON SDK in a browser environment.

## HTML Example

The `index.html` file demonstrates how to use the SDK directly in a browser without any build tools. This is useful for simple applications or for testing the SDK.

### How to Run the Example

1. Install dependencies:

```bash
npm install
```

2. Start the example server:

```bash
npm run start:example
```

3. Open your browser to http://localhost:3000

## Importing the SDK in HTML

There are several ways to import the HAPI TON SDK in an HTML file:

### Method 1: Using CDN (Recommended for production)

```html
<!-- Load dependencies first -->
<script src="https://cdn.jsdelivr.net/npm/buffer@6.0.3/index.min.js"></script>
<script>
  // Make Buffer available globally
  window.Buffer = buffer.Buffer;
</script>

<!-- Load TON dependencies -->
<script src="https://cdn.jsdelivr.net/npm/@ton/core@0.60.0/dist/ton-core.min.js"></script>
<script>
  // Make ton-core available globally
  window.ton = ton;
</script>

<!-- Load the SDK from CDN -->
<script src="https://cdn.jsdelivr.net/npm/@hapi/ton-sdk/dist/hapi-sdk.js"></script>

<script>
  // The SDK is available as 'HapiSDK'
  const sdk = new HapiSDK({
    referralId: 0,
    publicClient: "https://tonapi.io/v2",
    tonApiKey: "YOUR_API_KEY",
  });
</script>
```

### Method 2: Using Local Files (Development)

When developing locally, you can serve the SDK file from your local installation:

```html
<!-- Load dependencies first -->
<script src="https://cdn.jsdelivr.net/npm/buffer@6.0.3/index.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@ton/core@0.60.0/dist/ton-core.min.js"></script>

<!-- Load the SDK from local files -->
<script src="/node_modules/hapi-ton-sdk/dist/hapi-sdk.js"></script>

<script>
  // The SDK is available as 'HapiSDK'
  const sdk = new HapiSDK({
    /* config */
  });
</script>
```

### Method 3: Using ES Modules (Modern Browsers)

For modern browsers that support ES modules:

```html
<script type="module">
  import { Buffer } from "https://cdn.jsdelivr.net/npm/buffer@6.0.3/+esm";
  window.Buffer = Buffer;

  import * as ton from "https://cdn.jsdelivr.net/npm/@ton/core@0.60.0/+esm";
  window.ton = ton;

  import HapiSDK from "https://cdn.jsdelivr.net/npm/@hapi/ton-sdk/+esm";

  const sdk = new HapiSDK({
    /* config */
  });
</script>
```

## Important Notes

1. The SDK requires the `Buffer` and `ton` objects to be available globally
2. Make sure to load the dependencies before loading the SDK
3. For production use, specify the exact version of the SDK in the URL to avoid breaking changes

## Configuration

When initializing the SDK, you need to provide a configuration object:

```javascript
const sdk = new HapiSDK({
  referralId: 0,
  publicClient: "https://tonapi.io/v2",
  tonApiKey: "YOUR_API_KEY",
  endpoint: "https://api.hapi.one", // Optional
  contractAddress: "EQAvUDmCAM9Zl_i3rXeYA2n-s_uhM4rTBhzAQUeJIxEOB62i", // Optional
});
```

See the main README for more information on using the SDK.
