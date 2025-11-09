import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [foodListings, setFoodListings] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [showLogin, setShowLogin] = useState(false);

  // Test backend connection
  const testBackendConnection = async () => {
    try {
      setError('');
      const response = await axios.get('http://localhost:5000/');
      console.log('✅ Backend connection successful:', response.data);
      return true;
    } catch (error) {
      const errorMsg = `❌ Cannot connect to backend: ${error.message}`;
      setError(errorMsg);
      console.error(errorMsg);
      return false;
    }
  };

  // Fetch all food listings
  const fetchFoodListings = async () => {
    try {
      setError('');
      console.log('🔄 Fetching food listings...');
      const response = await axios.get(`${API_URL}/food-listings`);
      console.log('✅ Food listings:', response.data);
      setFoodListings(response.data.data);
    } catch (error) {
      const errorMsg = `Error fetching food listings: ${error.response?.data?.message || error.message}`;
      setError(errorMsg);
      console.error('❌', errorMsg);
    }
  };

  // Test API connection on component mount
  useEffect(() => {
    const initializeApp = async () => {
      const connected = await testBackendConnection();
      if (connected) {
        await fetchFoodListings();
      }
      setLoading(false);
    };

    initializeApp();
  }, []);

  // Handle role selection for registration
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setShowRegistration(true);
    setShowLogin(false);
  };

  // Register a new user with form
  const handleRegister = async (formData) => {
    try {
      setError('');
      console.log('🔄 Registering user...');
      
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: selectedRole,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        },
        organization: selectedRole !== 'recipient' ? {
          name: formData.organizationName,
          type: formData.organizationType,
          description: formData.organizationDescription
        } : undefined
      };

      console.log('📤 Sending registration data:', userData);
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      console.log('✅ Registration successful:', response.data);
      
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
      setShowRegistration(false);
      alert(`✅ Registration successful! Welcome ${response.data.user.name}`);
    } catch (error) {
      const errorMsg = `Registration failed: ${error.response?.data?.message || error.message}`;
      setError(errorMsg);
      console.error('❌', errorMsg);
      alert('❌ ' + errorMsg);
    }
  };

  // Login user
  const handleLogin = async (email, password) => {
    try {
      setError('');
      console.log('🔄 Logging in...');
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      console.log('✅ Login successful:', response.data);
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
      setShowLogin(false);
      alert(`✅ Welcome back, ${response.data.user.name}!`);
    } catch (error) {
      const errorMsg = `Login failed: ${error.response?.data?.message || error.message}`;
      setError(errorMsg);
      console.error('❌', errorMsg);
      alert('❌ ' + errorMsg);
    }
  };

  // Create a food listing (for donors)
  const handleCreateListing = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('❌ Please login first to create a listing');
        setShowLogin(true);
        return;
      }

      if (user.role !== 'donor') {
        alert('❌ Only donors can create food listings');
        return;
      }

      const listingData = {
        title: "Fresh Bread and Pastries",
        description: "Day-old bread and pastries from local bakery. Perfect for families in need.",
        category: "baked",
        quantity: "15-20 items",
        expiryDate: "2024-01-20",
        availableFrom: new Date().toISOString(),
        availableUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        pickupAddress: user.address,
        specialInstructions: "Please come to the back entrance",
        allergens: ["gluten", "wheat"]
      };

      console.log('📤 Sending food listing data:', listingData);
      const response = await axios.post(`${API_URL}/food-listings`, listingData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Food listing created:', response.data);
      alert('✅ Food listing created successfully!');
      await fetchFoodListings();
    } catch (error) {
      const errorMsg = `Failed to create listing: ${error.response?.data?.message || error.message}`;
      setError(errorMsg);
      console.error('❌', errorMsg);
      alert('❌ ' + errorMsg);
    }
  };

  // Reserve a food listing (for recipients)
  const handleReserveListing = async (listingId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('❌ Please login first to reserve food');
        setShowLogin(true);
        return;
      }

      if (user.role !== 'recipient') {
        alert('❌ Only recipients can reserve food listings');
        return;
      }

      const response = await axios.put(
        `${API_URL}/food-listings/${listingId}/reserve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('✅ Food reserved successfully! Please pick it up during the specified time.');
      await fetchFoodListings();
    } catch (error) {
      const errorMsg = `Reservation failed: ${error.response?.data?.message || error.message}`;
      alert('❌ ' + errorMsg);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    alert('✅ Logged out successfully!');
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading">Loading Food Rescue App...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🍽️ Food Rescue Platform</h1>
        <p>Connecting food donors with those in need</p>
        
        {/* User Actions */}
        <div className="header-actions">
          {!user ? (
            <div className="auth-buttons">
              <button onClick={() => setShowLogin(true)} className="btn btn-login">
                Login
              </button>
            </div>
          ) : (
            <div className="user-actions">
              <span>Welcome, {user.name} ({user.role})</span>
              <button onClick={handleLogout} className="btn btn-logout">
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="container">
        {/* Error Display */}
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Role Selection */}
        {!user && !showRegistration && !showLogin && (
          <div className="role-selection">
            <h2>Join Food Rescue as:</h2>
            <div className="role-cards">
              <div className="role-card donor-card">
                <h3>🥗 Food Donor</h3>
                <p>Restaurants, Grocery Stores, Individuals</p>
                <ul>
                  <li>List surplus food</li>
                  <li>Help reduce waste</li>
                  <li>Support your community</li>
                </ul>
                <button onClick={() => handleRoleSelect('donor')} className="btn btn-donor">
                  Join as Donor
                </button>
              </div>

              <div className="role-card recipient-card">
                <h3>👥 Food Recipient</h3>
                <p>Individuals, Families, Shelters</p>
                <ul>
                  <li>Find free food nearby</li>
                  <li>Reserve available listings</li>
                  <li>Reduce food expenses</li>
                </ul>
                <button onClick={() => handleRoleSelect('recipient')} className="btn btn-recipient">
                  Join as Recipient
                </button>
              </div>

              <div className="role-card volunteer-card">
                <h3>🤝 Volunteer</h3>
                <p>Community Helpers, Organizations</p>
                <ul>
                  <li>Help with food distribution</li>
                  <li>Coordinate pickups</li>
                  <li>Support the community</li>
                </ul>
                <button onClick={() => handleRoleSelect('volunteer')} className="btn btn-volunteer">
                  Join as Volunteer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Registration Form */}
        {showRegistration && (
          <RegistrationForm 
            role={selectedRole}
            onSubmit={handleRegister}
            onCancel={() => setShowRegistration(false)}
          />
        )}

        {/* Login Form */}
        {showLogin && (
          <LoginForm 
            onSubmit={handleLogin}
            onCancel={() => setShowLogin(false)}
          />
        )}

        {/* Main App Content for Logged-in Users */}
        {user && (
          <div className="app-content">
            <div className="user-dashboard">
              <h2>Welcome, {user.name}!</h2>
              <p>You are logged in as a <strong>{user.role}</strong></p>
              
              {/* Role-specific actions */}
              <div className="role-actions">
                {user.role === 'donor' && (
                  <button onClick={handleCreateListing} className="btn btn-primary">
                    🥗 Create Food Listing
                  </button>
                )}
                
                {user.role === 'volunteer' && (
                  <div className="volunteer-actions">
                    <button className="btn btn-primary">
                      📋 View Available Pickups
                    </button>
                    <button className="btn btn-secondary">
                      🗺️ View Distribution Map
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Food Listings */}
            <div className="listings">
              <h2>Available Food Listings ({foodListings.length})</h2>
              <button onClick={fetchFoodListings} className="btn btn-refresh">
                🔄 Refresh Listings
              </button>
              
              {foodListings.length === 0 ? (
                <p>No food listings available. Check back later!</p>
              ) : (
                <div className="listing-grid">
                  {foodListings.map((listing) => (
                    <div key={listing._id} className="listing-card">
                      <div className="listing-header">
                        <h3>{listing.title}</h3>
                        <span className={`status ${listing.status}`}>
                          {listing.status}
                        </span>
                      </div>
                      <p>{listing.description}</p>
                      <div className="listing-details">
                        <span>🍎 Category: {listing.category}</span>
                        <span>📦 Quantity: {listing.quantity}</span>
                        <span>⏰ Expires: {new Date(listing.expiryDate).toLocaleDateString()}</span>
                        <span>📍 Pickup: {listing.pickupAddress?.city}, {listing.pickupAddress?.state}</span>
                      </div>
                      {listing.donor && (
                        <p className="donor">👤 Donor: {listing.donor.name}</p>
                      )}
                      
                      {/* Action buttons based on user role */}
                      <div className="listing-actions">
                        {user.role === 'recipient' && listing.status === 'available' && (
                          <button 
                            onClick={() => handleReserveListing(listing._id)}
                            className="btn btn-reserve"
                          >
                            🛒 Reserve This Food
                          </button>
                        )}
                        
                        {listing.status === 'reserved' && (
                          <span className="reserved-badge">✅ Reserved</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Registration Form Component
function RegistrationForm({ role, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    organizationName: '',
    organizationType: '',
    organizationDescription: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="registration-form">
      <h2>Register as {role.charAt(0).toUpperCase() + role.slice(1)}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Password *</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
          />
        </div>

        <div className="form-group">
          <label>Phone *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Street *</label>
            <input
              type="text"
              name="street"
              value={formData.street}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>City *</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>State *</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>ZIP Code *</label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Organization fields for donors and volunteers */}
        {(role === 'donor' || role === 'volunteer') && (
          <>
            <div className="form-group">
              <label>Organization Name</label>
              <input
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Organization Type</label>
              <select
                name="organizationType"
                value={formData.organizationType}
                onChange={handleChange}
              >
                <option value="">Select type</option>
                <option value="restaurant">Restaurant</option>
                <option value="grocery">Grocery Store</option>
                <option value="bakery">Bakery</option>
                <option value="cafe">Cafe</option>
                <option value="catering">Catering Service</option>
                <option value="nonprofit">Non-Profit</option>
                <option value="individual">Individual</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Organization Description</label>
              <textarea
                name="organizationDescription"
                value={formData.organizationDescription}
                onChange={handleChange}
                rows="3"
              />
            </div>
          </>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Register as {role}
          </button>
          <button type="button" onClick={onCancel} className="btn btn-cancel">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// Login Form Component
function LoginForm({ onSubmit, onCancel }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <div className="login-form">
      <h2>Login to Food Rescue</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Login
          </button>
          <button type="button" onClick={onCancel} className="btn btn-cancel">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default App;