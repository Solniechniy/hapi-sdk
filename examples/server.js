const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the examples directory
app.use(express.static(__dirname));

// Serve the SDK bundle
app.use('/sdk', express.static(path.join(__dirname, '../dist')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
}); 