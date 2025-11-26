-- Migration: Add description column to indicators table
-- Date: 2025-11-26

USE threat_intelligence;

-- Add description column to indicators table
-- If it already exists, this will fail gracefully
ALTER TABLE indicators 
ADD COLUMN description TEXT AFTER last_seen;

-- Verify the change
DESCRIBE indicators;
