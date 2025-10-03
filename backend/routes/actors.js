const express = require('express');
const router = express.Router();
const actorController = require('../controllers/actorController');

// Get all threat actors
router.get('/', actorController.getAll);

// Get single actor by ID
router.get('/:id', actorController.getById);

// Create new actor
router.post('/', actorController.create);

// Update actor
router.put('/:id', actorController.update);

// Delete actor
router.delete('/:id', actorController.delete);

// Get indicators associated with an actor
router.get('/:id/indicators', actorController.getIndicators);

// Get campaigns associated with an actor
router.get('/:id/campaigns', actorController.getCampaigns);

// Get actor profile with statistics
router.get('/:id/profile', actorController.getProfile);

module.exports = router;
