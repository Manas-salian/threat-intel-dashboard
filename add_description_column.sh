#!/bin/bash

# Run indicator description migration
echo "=================================="
echo "Adding description column to indicators table"
echo "=================================="
echo ""
echo "You will be prompted for your MySQL root password"
echo ""

mysql -u root -p threat_intelligence << EOF
ALTER TABLE indicators ADD COLUMN description TEXT AFTER last_seen;
SELECT 'Migration completed successfully!' as status;
DESCRIBE indicators;
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Description column added to indicators table"
    echo ""
    echo "Next steps:"
    echo "1. Restart your backend server if it's running"
    echo "2. Test by adding an indicator with description"
    echo "3. (Optional) Run: node backend/scripts/ingest_normalized.js to repopulate with descriptions"
else
    echo ""
    echo "❌ ERROR: Migration failed. Check if column already exists."
    echo "Run: mysql -u root -p -e 'DESCRIBE threat_intelligence.indicators;' to check"
fi
