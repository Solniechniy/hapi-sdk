const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the examples directory
app.use(express.static(path.join(__dirname)));

// Serve the node_modules directory for direct access to the npm package
app.use(
  "/node_modules",
  express.static(path.join(__dirname, "../node_modules"))
);

// Serve the index.html file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Open your browser to test the SDK`);
});
