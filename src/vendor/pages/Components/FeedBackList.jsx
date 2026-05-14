import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import './FeedbackModal.css';
import { Star, User, Calendar, MessageSquare, X, Filter } from 'lucide-react';

const FeedbackListModal = ({ isOpen, onClose, vendorId, vendorName }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterRating, setFilterRating] = useState(0); // 0 means all ratings

  useEffect(() => {
    const fetchFeedbacks = async () => {
      if (!isOpen || !vendorId) return;

      setLoading(true);
      setError(null);

      try {
        // Select feedback along with related user info
        let query = supabase
          .from('feedback')
          .select('*, users(*)')
          .eq('shop_id', vendorId)
          .order('created_at', { ascending: false });

        // Apply rating filter if selected
        if (filterRating > 0) {
          query = query.eq('rating', filterRating);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          console.error('Error fetching feedbacks:', fetchError);
          setError('Failed to load feedbacks');
          return;
        }

  // Supabase returns `users` as an object inside each feedback row when using users(*)
  setFeedbacks(data || []);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [isOpen, vendorId, filterRating]);

  const getRatingText = (rating) => {
    const ratings = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return ratings[rating] || 'No rating';
  };

  const getRatingColor = (rating) => {
    const colors = {
      1: '#ef4444', // red
      2: '#f97316', // orange
      3: '#eab308', // yellow
      4: '#84cc16', // lime
      5: '#22c55e'  // green
    };
    return colors[rating] || '#6b7280';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateStats = () => {
    if (feedbacks.length === 0) {
      return {
        averageRating: 0,
        totalFeedbacks: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    // Ensure ratings are numbers and handle missing/null ratings
    const total = feedbacks.reduce((sum, feedback) => sum + (Number(feedback.rating) || 0), 0);
    const averageRating = (total / feedbacks.length).toFixed(1);
    
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbacks.forEach(feedback => {
      const r = Number(feedback.rating) || 0;
      if (r >= 1 && r <= 5) ratingDistribution[r]++;
    });

    return {
      averageRating,
      totalFeedbacks: feedbacks.length,
      ratingDistribution
    };
  };

  const stats = calculateStats();

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div className="feedback-modal-overlay" onClick={onClose}>
        
        {/* Modal Container - Wider for list view */}
        <div className="feedback-modal-container wide" onClick={(e) => e.stopPropagation()}>
          
          {/* Modal Content */}
          <div className="feedback-modal-content">
            
            {/* Header */}
            <div className="feedback-modal-header">
              <div className="header-content">
                <h2 className="feedback-modal-title">
                  Customer Feedback <MessageSquare />
                </h2>
                {vendorName && (
                  <p className="vendor-subtitle">for {vendorName}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="feedback-close-button"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Stats Section */}
            {feedbacks.length > 0 && (
              <div className="feedback-stats">
                <div className="stat-item">
                  <div className="stat-value">{stats.averageRating}</div>
                  <div className="stat-label">Average Rating</div>
                  <div className="stat-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        fill={star <= stats.averageRating ? '#fbbf24' : 'none'}
                        color="#fbbf24"
                      />
                    ))}
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.totalFeedbacks}</div>
                  <div className="stat-label">Total Reviews</div>
                </div>
              </div>
            )}

            {/* Rating Distribution */}
            {feedbacks.length > 0 && (
              <div className="rating-distribution">
                <h4>Rating Distribution</h4>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="distribution-row">
                    <span className="distribution-stars">
                      {rating} <Star size={14} fill="#fbbf24" color="#fbbf24" />
                    </span>
                    <div className="distribution-bar">
                      <div 
                        className="distribution-fill"
                        style={{ 
                          width: `${(stats.ratingDistribution[rating] / stats.totalFeedbacks) * 100}%`,
                          backgroundColor: getRatingColor(rating)
                        }}
                      />
                    </div>
                    <span className="distribution-count">
                      {stats.ratingDistribution[rating]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Filter Section */}
            {feedbacks.length > 0 && (
              <div className="filter-section">
                <Filter size={16} />
                <label>Filter by rating:</label>
                <select 
                  value={filterRating} 
                  onChange={(e) => setFilterRating(Number(e.target.value))}
                  className="rating-filter"
                >
                  <option value={0}>All Ratings</option>
                  <option value={5}>5 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={3}>3 Stars</option>
                  <option value={2}>2 Stars</option>
                  <option value={1}>1 Star</option>
                </select>
              </div>
            )}

            {/* Feedback List */}
            <div className="feedback-list">
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading feedbacks...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <p>{error}</p>
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="empty-state">
                  <MessageSquare size={48} className="empty-icon" />
                  <h3>No Feedback Yet</h3>
                  <p>This shop doesn't have any reviews yet. Be the first to leave feedback!</p>
                </div>
              ) : (
                <div className="feedbacks-container">
                  {feedbacks.map((feedback) => (
                    <div key={feedback.id} className="feedback-item">
                      {/* Header with user info and rating */}
                      <div className="feedback-header">
                        <div className="user-info">
                          <User size={16} />
                          <span className="user-email">
                            {feedback.users?.email || 'Anonymous User'}
                          </span>
                          {feedback.users?.user_type && (
                            <span className="user-type">{feedback.users.user_type}</span>
                          )}
                        </div>
                        <div className="feedback-meta">
                          <div 
                            className="rating-badge"
                            style={{ backgroundColor: getRatingColor(feedback.rating) }}
                          >
                            {feedback.rating} <Star size={14} fill="white" color="white" />
                          </div>
                          <div className="feedback-date">
                            <Calendar size={14} />
                            {formatDate(feedback.created_at)}
                          </div>
                        </div>
                      </div>

                      {/* Rating stars */}
                      <div className="feedback-rating">
                        <div className="rating-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={16}
                              fill={star <= feedback.rating ? '#fbbf24' : 'none'}
                              color="#fbbf24"
                            />
                          ))}
                        </div>
                        <span className="rating-text">
                          {getRatingText(feedback.rating)}
                        </span>
                      </div>

                      {/* Comment */}
                      {feedback.comment && (
                        <div className="feedback-comment">
                          <p>{feedback.comment}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="modal-footer">
              <button
                onClick={onClose}
                className="close-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeedbackListModal;