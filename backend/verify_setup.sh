#!/bin/bash

# Quick test script to verify backend setup

echo "=================================="
echo "Backend Setup Verification"
echo "=================================="
echo ""

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✓ Node.js installed: $NODE_VERSION"
else
    echo "❌ Node.js not found"
    exit 1
fi

# Check npm
echo "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✓ npm installed: $NPM_VERSION"
else
    echo "❌ npm not found"
    exit 1
fi

# Check if node_modules exists
echo ""
echo "Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "✓ Dependencies installed"
else
    echo "⚠ Dependencies not installed. Run 'npm install'"
fi

# Check if required files exist
echo ""
echo "Checking required files..."
FILES=(
    "server.js"
    "package.json"
    "config/database.js"
    "scripts/schema.sql"
    "scripts/seed_data.sql"
)

ALL_FILES_EXIST=true
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "❌ $file (missing)"
        ALL_FILES_EXIST=false
    fi
done

# Check MySQL
echo ""
echo "Checking MySQL..."
if command -v mysql &> /dev/null; then
    MYSQL_VERSION=$(mysql --version | awk '{print $5}' | sed 's/,//')
    echo "✓ MySQL installed: $MYSQL_VERSION"
else
    echo "❌ MySQL not found"
fi

echo ""
echo "=================================="
if [ "$ALL_FILES_EXIST" = true ]; then
    echo "✓ All checks passed!"
    echo ""
    echo "Next steps:"
    echo "1. Run './setup_db.sh' to set up the database"
    echo "2. Update credentials in config/database.js or .env"
    echo "3. Run 'npm start' to start the server"
else
    echo "⚠ Some files are missing"
fi
echo "=================================="
