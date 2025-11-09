const express = require('express');
const { protect } = require('../middleware/auth');
const Donation = require('../models/Donation');

const router = express.Router();

// @desc    Get user's donations
// @route   GET /api/donations
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const donations = await Donation.find({
      $or: [
        { donor: req.user.id },
        { recipient: req.user.id }
      ]
    })
    .populate('foodListing')
    .populate('donor', 'name email phone')
    .populate('recipient', 'name email phone')
    .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: donations
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Create donation
// @route   POST /api/donations
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    req.body.recipient = req.user.id;
    const donation = await Donation.create(req.body);

    res.status(201).json({
      success: true,
      data: donation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;