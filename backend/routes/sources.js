const express = require('express');
const router = express.Router();
const sourceController = require('../controllers/sourceController');

// Get all sources
router.get('/', sourceController.getAll);

// Get single source by ID
router.get('/:id', sourceController.getById);

// Create new source
router.post('/', sourceController.create);

// Update source
router.put('/:id', sourceController.update);

// Delete source
router.delete('/:id', sourceController.delete);

// Get indicators from a source
router.get('/:id/indicators', sourceController.getIndicators);

module.exports = router;
