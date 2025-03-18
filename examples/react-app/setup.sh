#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up HAPI TON SDK React Example...${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
  cp .env.example .env
  echo -e "${YELLOW}Please edit .env file to add your TON API key!${NC}"
fi

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
npm install

# Build the app
echo -e "${GREEN}Building the app...${NC}"
npm run build

# Start the app
echo -e "${GREEN}Starting the app...${NC}"
echo -e "${YELLOW}Open http://localhost:3000 in your browser${NC}"
npm start 