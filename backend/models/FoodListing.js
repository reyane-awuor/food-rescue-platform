const mongoose = require('mongoose');

const foodListingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  donor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['fruits', 'vegetables', 'dairy', 'grains', 'meat', 'prepared', 'baked', 'other'],
    required: true
  },
  quantity: {
    type: String,
    required: [true, 'Please add quantity']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Please add expiry date']
  },
  images: [String],
  pickupAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  availableFrom: {
    type: Date,
    required: true
  },
  availableUntil: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'claimed', 'expired'],
    default: 'available'
  },
  reservedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  claimedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  specialInstructions: String,
  allergens: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for geospatial queries
foodListingSchema.index({ "pickupAddress.coordinates": "2dsphere" });

module.exports = mongoose.model('FoodListing', foodListingSchema);