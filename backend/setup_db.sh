#!/bin/bash

# Threat Intelligence Database Setup Script
# This script helps set up the MySQL database

echo "=================================="
echo "Threat Intelligence DB Setup"
echo "=================================="
echo ""

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL first."
    exit 1
fi

echo "✓ MySQL is installed"
echo ""

# Database name
DB_NAME="threat_intelligence"

echo "This script will:"
echo "1. Create the database '$DB_NAME'"
echo "2. Create all required tables"
echo "3. Load sample data"
echo ""

read -p "Do you want to continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 0
fi

echo ""
echo "Please enter your MySQL credentials:"
read -p "MySQL username (default: root): " MYSQL_USER
MYSQL_USER=${MYSQL_USER:-root}

read -sp "MySQL password: " MYSQL_PASS
echo ""

# Test MySQL connection
echo ""
echo "Testing MySQL connection..."
if mysql -u"$MYSQL_USER" -p"$MYSQL_PASS" -e "SELECT 1;" &> /dev/null; then
    echo "✓ MySQL connection successful"
else
    echo "❌ MySQL connection failed. Please check your credentials."
    exit 1
fi

# Create database
echo ""
echo "Creating database '$DB_NAME'..."
mysql -u"$MYSQL_USER" -p"$MYSQL_PASS" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✓ Database created successfully"
else
    echo "❌ Failed to create database"
    exit 1
fi

# Run schema
echo ""
echo "Creating tables..."
mysql -u"$MYSQL_USER" -p"$MYSQL_PASS" "$DB_NAME" < scripts/schema.sql 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✓ Tables created successfully"
else
    echo "❌ Failed to create tables"
    exit 1
fi

# Load sample data
echo ""
read -p "Do you want to load sample data? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Loading sample data..."
    mysql -u"$MYSQL_USER" -p"$MYSQL_PASS" "$DB_NAME" < scripts/seed_data.sql 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✓ Sample data loaded successfully"
    else
        echo "⚠ Warning: Some sample data may not have loaded"
    fi
fi

# Update database config
echo ""
echo "Updating database configuration..."
CONFIG_FILE="config/database.js"

# Create backup of config file
cp "$CONFIG_FILE" "$CONFIG_FILE.backup"

# Note: This is a basic replacement. You may need to manually update the password
echo "⚠ Please manually update your database credentials in:"
echo "   $CONFIG_FILE"
echo ""
echo "Set the following values:"
echo "   user: '$MYSQL_USER'"
echo "   password: 'your_password'"
echo ""

# Show table count
TABLE_COUNT=$(mysql -u"$MYSQL_USER" -p"$MYSQL_PASS" "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | wc -l)
TABLE_COUNT=$((TABLE_COUNT - 1))

echo "=================================="
echo "✓ Setup Complete!"
echo "=================================="
echo ""
echo "Database: $DB_NAME"
echo "Tables created: $TABLE_COUNT"
echo ""
echo "Next steps:"
echo "1. Update database credentials in config/database.js"
echo "2. Run 'npm start' to start the server"
echo "3. Visit http://localhost:5000 to test the API"
echo ""
