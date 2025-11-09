const express = require('express');
const {
  getFoodListings,
  getFoodListing,
  createFoodListing,
  updateFoodListing,
  deleteFoodListing,
  reserveFoodListing
} = require('../controllers/foodListingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(getFoodListings)
  .post(protect, createFoodListing);

router.route('/:id')
  .get(getFoodListing)
  .put(protect, updateFoodListing)
  .delete(protect, deleteFoodListing);

router.put('/:id/reserve', protect, reserveFoodListing);

module.exports = router;