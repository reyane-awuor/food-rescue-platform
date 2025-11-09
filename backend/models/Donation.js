const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  foodListing: {
    type: mongoose.Schema.ObjectId,
    ref: 'FoodListing',
    required: true
  },
  donor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['reserved', 'picked-up', 'completed', 'cancelled'],
    default: 'reserved'
  },
  scheduledPickup: {
    type: Date,
    required: true
  },
  actualPickup: Date,
  rating: {
    byDonor: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String
    },
    byRecipient: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String
    }
  },
  completionNotes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Donation', donationSchema);