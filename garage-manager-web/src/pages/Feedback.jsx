import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Star, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

export default function Feedback() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' or 'complaints'
  
  const [reviews, setReviews] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const fetchFeedbackParams = useCallback(async () => {
    if (!user?.GarageID) return;
    
    try {
      setLoading(true);
      const [reviewsRes, complaintsRes] = await Promise.all([
        api.get(`/reviews/garage/${user.GarageID}`),
        api.get(`/complaints/garage/${user.GarageID}`)
      ]);
      
      setReviews(reviewsRes.data);
      setComplaints(complaintsRes.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch feedback', err);
      setError('Failed to load feedback metrics.');
    } finally {
      setLoading(false);
    }
  }, [user?.GarageID]);

  useEffect(() => {
    fetchFeedbackParams();
  }, [fetchFeedbackParams]);

  const handleResolveComplaint = async (complaintId) => {
    try {
      await api.put(`/complaints/${complaintId}/resolve`, { status: 'Resolved' });
      showSuccess('Complaint officially marked as resolved');
      fetchFeedbackParams();
    } catch (err) {
      console.error('Failed to resolve complaint', err);
      alert(err.response?.data?.message || 'Failed to update complaint status');
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, curr) => acc + curr.Rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-primary)] flex items-center gap-2">
            <MessageSquare size={28} />
            Customer Feedback
          </h1>
          <p className="text-gray-500 mt-1">Monitor reviews and resolve customer complaints.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200 flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle size={18} />
          <span className="font-medium text-sm">{successMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'reviews'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('reviews')}
        >
          Customer Reviews ({reviews.length})
        </button>
        <button
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'complaints'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('complaints')}
        >
          Active Complaints
          {complaints.filter(c => c.Status !== 'Resolved').length > 0 && (
            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
              {complaints.filter(c => c.Status !== 'Resolved').length}
            </span>
          )}
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <span className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : (
          <>
            {/* Reviews View */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-[var(--color-border)] flex items-center gap-6">
                  <div className="flex flex-col items-center justify-center p-4 bg-orange-50 rounded-lg min-w-[120px]">
                    <span className="text-4xl font-extrabold text-orange-500">{calculateAverageRating()}</span>
                    <div className="flex text-orange-400 mt-1">
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                    </div>
                    <span className="text-xs text-gray-500 mt-2">{reviews.length} total reviews</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Overall Rating</h3>
                    <p className="text-sm text-gray-500">Based on verified completed service requests.</p>
                  </div>
                </div>

                {reviews.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                    <Star size={40} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No reviews have been published yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reviews.map(review => (
                      <div key={review.ReviewID} className="bg-white p-5 rounded-xl shadow-sm border border-[var(--color-border)]">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex text-orange-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={16} fill={i < review.Rating ? "currentColor" : "none"} className={i >= review.Rating ? "text-gray-200" : ""} />
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">{new Date(review.ReviewDate).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">"{review.Comment}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Complaints View */}
            {activeTab === 'complaints' && (
              <div className="space-y-4">
                {complaints.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                    <AlertCircle size={40} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No complaints have been filed against your garage!</p>
                  </div>
                ) : (
                  <div className="overflow-hidden bg-white shadow-sm rounded-xl border border-[var(--color-border)]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                          <th className="p-4 font-semibold w-24">ID</th>
                          <th className="p-4 font-semibold">Customer</th>
                          <th className="p-4 font-semibold">Description</th>
                          <th className="p-4 font-semibold">Status</th>
                          <th className="p-4 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {complaints.map(complaint => (
                          <tr key={complaint.ComplaintID} className="border-b border-gray-50 hover:bg-slate-50/50">
                            <td className="p-4 text-gray-500 font-mono">#{complaint.ComplaintID}</td>
                            <td className="p-4 font-medium text-gray-900">
                              {complaint.CustomerName || `Customer #${complaint.CustomerID}`}
                            </td>
                            <td className="p-4 text-gray-600 max-w-sm truncate">
                              {complaint.Description}
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded inline-flex font-semibold text-[10px] uppercase tracking-wide border ${
                                complaint.Status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-200' : 
                                complaint.Status === 'InProgress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {complaint.Status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {complaint.Status !== 'Resolved' ? (
                                <button
                                  onClick={() => handleResolveComplaint(complaint.ComplaintID)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-md font-semibold text-xs transition-colors"
                                >
                                  <CheckCircle size={14} />
                                  Mark Resolved
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-gray-400 text-xs font-semibold px-3 py-1.5">
                                  <CheckCircle size={14} />
                                  Resolved
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
