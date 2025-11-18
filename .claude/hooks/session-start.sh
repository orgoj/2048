#!/bin/bash
set -euo pipefail

# Only run in Claude Code on the web (remote environment)
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "🚀 Setting up 2048 development environment..."

# Install npm dependencies
# Using 'npm install' instead of 'npm ci' to leverage container caching
echo "📦 Installing dependencies..."
npm install

# Ensure Husky hooks are set up
echo "🪝 Setting up pre-commit hooks..."
npm run prepare

# Verify TypeScript compilation
echo "🔍 Verifying TypeScript setup..."
npx tsc --version

echo "✅ Environment setup complete!"
