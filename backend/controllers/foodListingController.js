const FoodListing = require('../models/FoodListing');

// @desc    Get all food listings
// @route   GET /api/food-listings
// @access  Public
exports.getFoodListings = async (req, res, next) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = FoodListing.find(JSON.parse(queryStr)).populate('donor', 'name email phone');

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await FoodListing.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const foodListings = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: foodListings.length,
      pagination,
      data: foodListings
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single food listing
// @route   GET /api/food-listings/:id
// @access  Public
exports.getFoodListing = async (req, res, next) => {
  try {
    const foodListing = await FoodListing.findById(req.params.id).populate('donor', 'name email phone address');

    if (!foodListing) {
      return res.status(404).json({
        success: false,
        message: 'Food listing not found'
      });
    }

    res.status(200).json({
      success: true,
      data: foodListing
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create food listing
// @route   POST /api/food-listings
// @access  Private
exports.createFoodListing = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.donor = req.user.id;

    const foodListing = await FoodListing.create(req.body);

    // Emit real-time notification
    const io = req.app.get('io');
    io.emit('new-listing', {
      message: 'New food listing available!',
      listing: foodListing
    });

    res.status(201).json({
      success: true,
      data: foodListing
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update food listing
// @route   PUT /api/food-listings/:id
// @access  Private
exports.updateFoodListing = async (req, res, next) => {
  try {
    let foodListing = await FoodListing.findById(req.params.id);

    if (!foodListing) {
      return res.status(404).json({
        success: false,
        message: 'Food listing not found'
      });
    }

    // Make sure user is food listing owner
    if (foodListing.donor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'User not authorized to update this food listing'
      });
    }

    foodListing = await FoodListing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: foodListing
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete food listing
// @route   DELETE /api/food-listings/:id
// @access  Private
exports.deleteFoodListing = async (req, res, next) => {
  try {
    const foodListing = await FoodListing.findById(req.params.id);

    if (!foodListing) {
      return res.status(404).json({
        success: false,
        message: 'Food listing not found'
      });
    }

    // Make sure user is food listing owner
    if (foodListing.donor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'User not authorized to delete this food listing'
      });
    }

    await foodListing.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reserve food listing
// @route   PUT /api/food-listings/:id/reserve
// @access  Private
exports.reserveFoodListing = async (req, res, next) => {
  try {
    const foodListing = await FoodListing.findById(req.params.id);

    if (!foodListing) {
      return res.status(404).json({
        success: false,
        message: 'Food listing not found'
      });
    }

    if (foodListing.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Food listing is not available for reservation'
      });
    }

    foodListing.status = 'reserved';
    foodListing.reservedBy = req.user.id;
    await foodListing.save();

    res.status(200).json({
      success: true,
      data: foodListing
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};