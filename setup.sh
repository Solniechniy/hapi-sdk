#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up HAPI TON SDK and React Example...${NC}"

# Install root dependencies
echo -e "${GREEN}Installing SDK dependencies...${NC}"
npm install --legacy-peer-deps

# Build the SDK
echo -e "${GREEN}Building the SDK...${NC}"
npm run build

# Make the example scripts executable
chmod +x examples/react-app/setup.sh

# Set up React example
echo -e "${GREEN}Setting up React example...${NC}"
cd examples/react-app

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
  cp .env.example .env
  echo -e "${YELLOW}Please edit .env file to add your TON API key!${NC}"
fi

# Install dependencies
echo -e "${GREEN}Installing React example dependencies...${NC}"
npm install

echo -e "${GREEN}Setup complete!${NC}"
echo -e "${YELLOW}To start the React example, run:${NC}"
echo -e "  cd examples/react-app"
echo -e "  npm start"
echo -e "${YELLOW}Then open http://localhost:3000 in your browser${NC}" 