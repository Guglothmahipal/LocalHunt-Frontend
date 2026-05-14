import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './FeedbackModal.css';
import { UserCheck,CircleAlert,CircleCheck,CircleX,MessageSquareReply } from 'lucide-react';

const FeedbackModal = ({ isOpen, onClose, vendorId, vendorName }) => {
  const [formData, setFormData] = useState({
    rating: 0,
    comment: ''
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [existingFeedbackId, setExistingFeedbackId] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (isOpen) {
        try {
          // Get user from localStorage
          const localUser = localStorage.getItem('user');
          if (localUser) {
            const userData = JSON.parse(localUser);
            console.log('User from localStorage:', userData);
            
            const user = {
              id: userData.user_id || userData.id,
              email: userData.email || 'user@example.com',
              phone: userData.phone,
              user_type: userData.user_type
            };
            setCurrentUser(user);

            // Check if user exists in public.users table
            const { data: dbUser, error } = await supabase
              .from('users')
              .select('id')
              .eq('id', user.id)
              .maybeSingle();

            if (error) {
              console.error('Error checking user in database:', error);
            }

            if (!dbUser) {
              console.log('User not found in public.users, need to sync');
              // User doesn't exist in database, we'll handle this during submission
            }
          }
        } catch (error) {
          console.error('Error checking auth:', error);
        }
      }
    };

    checkAuth();
  }, [isOpen]);

  // When modal opens and we have a user and vendorId, fetch existing feedback to allow editing
  useEffect(() => {
    const fetchExistingFeedback = async () => {
      if (!isOpen || !currentUser || !currentUser.id || !vendorId) return;

      try {
        const { data: existing, error } = await supabase
          .from('feedback')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('shop_id', vendorId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching existing feedback:', error);
          return;
        }

        if (existing) {
          setFormData({
            rating: existing.rating || 0,
            comment: existing.comment || ''
          });
          setExistingFeedbackId(existing.id);
        } else {
          // reset if no existing feedback
          setExistingFeedbackId(null);
          setFormData({ rating: 0, comment: '' });
        }
      } catch (err) {
        console.error('Unexpected error fetching feedback:', err);
      }
    };

    fetchExistingFeedback();
  }, [isOpen, currentUser, vendorId]);

  const showSuccessToast = (message) => {
    setSubmitStatus({ type: 'success', message });
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      resetForm();
      onClose();
    }, 3000);
  };

  const showErrorToast = (message) => {
    setSubmitStatus({ type: 'error', message });
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  // Function to sync user to public.users table
  const syncUserToDatabase = async (user) => {
    try {
      // Use upsert to insert or update the user record so foreign key constraints won't fail
      const { data, error } = await supabase
        .from('users')
        .upsert([
          {
            id: user.id,
            email: user.email,
            phone: user.phone,
            user_type: user.user_type || 'user',
            created_at: new Date().toISOString()
          }
        ], { onConflict: 'id', ignoreDuplicates: false })
        .select('id');

      if (error) {
        console.error('Supabase upsert error while syncing user:', error);
        return false;
      }

      if (data && data.length > 0) {
        console.log('User synced/upserted to database successfully:', data[0].id);
        return true;
      }

      // If no data returned, still consider it success when no error (edge case with RLS or policies)
      console.log('Upsert completed with no returned rows; assuming user exists or policies prevented returning data.');
      return true;
    } catch (error) {
      console.error('Error syncing user to database:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      showErrorToast('Please select a rating');
      return;
    }

    const user = currentUser;
    
    if (!user || !user.id) {
      console.error('No user ID found:', user);
      showErrorToast('Unable to verify your account. Please log in again.');
      return;
    }

    console.log('Submitting feedback as user:', user.id, user.email);

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // First, check if user exists in public.users table
      const { data: dbUser, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (userCheckError) {
        console.error('Error checking user in public.users:', userCheckError);
      }

      let userExistsInDb = !!dbUser;

      // If user doesn't exist in database, try to sync them
      if (!userExistsInDb) {
        console.log('User not found in database, attempting to sync...');
        userExistsInDb = await syncUserToDatabase(user);
      }

      // If we still can't verify the user exists, force anonymous submission
      const forceAnonymous = !userExistsInDb;
      
      if (forceAnonymous && !formData.anonymous) {
        showErrorToast('Your account needs to be synced. Submitting anonymously instead.');
        // Continue with anonymous submission
      }

        const payload = {
          user_id: user.id,
          shop_id: vendorId,
          rating: formData.rating,
          comment: formData.comment.trim()
        };

        if (existingFeedbackId) {
          console.log('Updating existing feedback id:', existingFeedbackId, 'with', payload);
          const { data, error } = await supabase
            .from('feedback')
            .update({ rating: payload.rating, comment: payload.comment })
            .eq('id', existingFeedbackId);

          if (error) {
            console.error('Supabase update error:', error);
            if (error.code === '23503' && error.message && error.message.includes('shop_id')) {
              showErrorToast('Invalid shop information. Please try again later.');
              return;
            }
            throw error;
          }

          console.log('Feedback updated successfully', data);
          showSuccessToast('Your feedback has been updated. Thank you!');
          return;
        }

        // No existing feedback - insert new
        console.log('Inserting new feedback data:', payload);
        const { error } = await supabase
          .from('feedback')
          .insert([payload]);
      if (error) {
        console.error('Supabase insert error:', error);
        if (error.code === '23505') {
          showErrorToast('You have already submitted feedback for this shop.');
          return;
        }

        if (error.code === '23503') {
          if (error.message && error.message.includes('shop_id')) {
            showErrorToast('Invalid shop information. Please try again later.');
          } else if (error.message && error.message.includes('user_id')) {
            showErrorToast('User not found in database. Please log in again.');
          } else {
            showErrorToast('Database error. Please try again.');
          }
          return;
        }

        throw error;
      }

      console.log('Feedback submitted successfully');
      showSuccessToast('Thank you for your feedback! 🎉');
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      
      if (error && error.code === '42501') {
        showErrorToast('You do not have permission to submit feedback.');
      } else {
        showErrorToast((error && error.message) || 'Failed to submit feedback. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      rating: 0,
      comment: ''
    });
    setHoverRating(0);
    setSubmitStatus(null);
    setShowToast(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const StarIcon = ({ filled, hovered, onClick, onMouseEnter, onMouseLeave }) => (
    <svg
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`feedback-star ${filled || hovered ? 'filled' : ''}`}
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Toast Notification */}
      {showToast && submitStatus && (
        <div className={`feedback-toast ${submitStatus.type} ${showToast ? 'show' : ''}`}>
          <div className="toast-content">
            <span className="toast-icon">
              {submitStatus.type === 'success' ? <CircleCheck /> : <CircleX />}
            </span>
            <span className="toast-message">{submitStatus.message}</span>
          </div>
          <button 
            className="toast-close"
            onClick={() => setShowToast(false)}
          >
            ×
          </button>
        </div>
      )}

      {/* Modal Overlay */}
      <div className="feedback-modal-overlay" onClick={handleClose}>
        
        {/* Modal Container */}
        <div className="feedback-modal-container" onClick={(e) => e.stopPropagation()}>
          
          {/* Modal Content */}
          <div className="feedback-modal-content">
            
            {/* Header */}
            <div className="feedback-modal-header">
              <h2 className="feedback-modal-title">
                Leave Feedback <MessageSquareReply />
              </h2>
              <button
                onClick={handleClose}
                className="feedback-close-button"
                aria-label="Close modal"
              >
                <svg className="close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="feedback-form">
              
              {/* Vendor Info */}
              {vendorName && (
                <div className="vendor-info">
                  <p className="vendor-label">Your feedback for</p>
                  <p className="vendor-name">{vendorName}</p>
                </div>
              )}

              {/* User Status Info */}
              <div className="user-status-info">
                {currentUser ? (
                  <p className="user-status-logged-in">
                    <UserCheck /> Ready to submit feedback as: {currentUser.email || `User (${currentUser.id})`}
                  </p>
                ) : (
                  <p className="user-status-logged-out">
                    <CircleAlert />Please log in to submit feedback
                  </p>
                )}
              </div>

              {/* Rating Section */}
              <div className="rating-section">
                <label className="rating-label">
                  Rating *
                </label>
                <div className="stars-container">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      filled={star <= formData.rating}
                      hovered={star <= hoverRating}
                      onClick={() => setFormData({ ...formData, rating: star })}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    />
                  ))}
                </div>
                <div className="rating-labels">
                  <span className="rating-label-min">Poor</span>
                  <span className="rating-label-max">Excellent</span>
                </div>
              </div>

              {/* Comment Section */}
              <div className="comment-section">
                <label htmlFor="comment" className="comment-label">
                  Comments (Optional)
                </label>
                <textarea
                  id="comment"
                  rows={4}
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="comment-textarea"
                  placeholder="Share your experience with this vendor..."
                  maxLength={500}
                />
                <div className="character-count">
                  {formData.comment.length}/500
                </div>
              </div>

              {/* Anonymous Toggle */}
              {/* <div className="anonymous-section">
                <input
                  id="anonymous"
                  type="checkbox"
                  checked={formData.anonymous}
                  onChange={(e) => setFormData({ ...formData, anonymous: e.target.checked })}
                  className="anonymous-checkbox"
                />
                <label htmlFor="anonymous" className="anonymous-label">
                  Submit anonymously
                  <span className="anonymous-hint">(Allows multiple submissions)</span>
                </label>
              </div> */}

              {/* Action Buttons */}
              <div className="action-buttons">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || formData.rating === 0}
                  className="submit-button"
                >
                  {isSubmitting ? (
                    <span className="button-loading">
                      <svg className="spinner" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Feedback'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeedbackModal;