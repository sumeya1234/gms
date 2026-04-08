import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { useTranslation } from 'react-i18next';
import { Filter, Edit2, UserPlus, X, Check, Eye } from 'lucide-react';

export default function Bookings() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  const [requests, setRequests] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Status Update State
  const [newStatus, setNewStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Assign State
  const [selectedMechanic, setSelectedMechanic] = useState('');
  
  // Filters
  const [filter, setFilter] = useState('All');

  const fetchRequests = useCallback(async () => {
    if (!user?.GarageID) return;
    try {
      setLoading(true);
      const response = await api.get(`/services/garage/${user.GarageID}`);
      setRequests(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [user?.GarageID]);

  const fetchMechanics = useCallback(async () => {
    if (!user?.GarageID) return;
    try {
      const response = await api.get(`/users/garage/${user.GarageID}/mechanics`);
      setMechanics(response.data);
    } catch (err) {
      console.error(err);
    }
  }, [user?.GarageID]);

  useEffect(() => {
    fetchRequests();
    fetchMechanics();
  }, [fetchRequests, fetchMechanics]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      if (newStatus === 'Rejected' && !rejectionReason.trim()) {
        alert("Please provide a rejection reason.");
        return;
      }

      await api.put(`/services/${selectedRequest.RequestID}/status`, {
        status: newStatus,
        rejectionReason: newStatus === 'Rejected' ? rejectionReason : undefined
      });
      
      setStatusModalOpen(false);
      setSelectedRequest(null);
      setNewStatus('');
      setRejectionReason('');
      fetchRequests();
    } catch (err) {
      const apiError = err.response?.data?.errors?.join(', ') || err.response?.data?.message || err.message || 'Failed to update status';
      alert(apiError);
    }
  };

  const handleAssignMechanic = async (e) => {
    e.preventDefault();
    try {
      if (!selectedMechanic) {
        alert("Please select a mechanic.");
        return;
      }
      await api.post(`/services/assign`, {
        requestId: selectedRequest.RequestID,
        mechanicId: selectedMechanic
      });
      
      setAssignModalOpen(false);
      setSelectedRequest(null);
      setSelectedMechanic('');
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to assign mechanic');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Approved': return 'bg-indigo-100 text-indigo-700';
      case 'InProgress': return 'bg-blue-100 text-blue-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const filteredRequests = filter === 'All' 
    ? requests 
    : requests.filter(req => req.Status?.toLowerCase() === filter.toLowerCase());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-[var(--color-primary)]">Bookings Management</h1>
        
        {/* Filters */}
        <div className="flex gap-2 p-1 bg-white rounded-lg shadow-sm border border-[var(--color-border)] overflow-x-auto">
          {['All', 'Pending', 'Approved', 'InProgress', 'Completed', 'Rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status 
                  ? 'bg-[var(--color-primary)] text-white shadow'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Main Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <span className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <Filter size={48} className="mb-4 opacity-20" />
            <p>No bookings found for the selected filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-[var(--color-border)] text-sm text-[var(--color-text-light)]">
                  <th className="p-4 font-semibold">ID</th>
                  <th className="p-4 font-semibold">Service Type</th>
                  <th className="p-4 font-semibold">Vehicle</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Emergency</th>
                  <th className="p-4 font-semibold border-l border-gray-100 w-[200px]">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredRequests.map((req) => (
                  <tr key={req.RequestID} className="border-b border-[var(--color-border)] hover:bg-slate-50/50">
                    <td className="p-4 text-[var(--color-text-main)] font-mono">#{req.RequestID}</td>
                    <td className="p-4 text-[var(--color-text-main)] font-medium">
                      {req.ServiceType}
                      <div className="text-xs text-gray-400 mt-1 truncate max-w-[200px]" title={req.Description}>
                        {req.Description}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      {/* Using the vehicle ID or plate if expanded in backend later */}
                      Vehicle #{req.VehicleID}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded inline-flex font-semibold capitalize ${getStatusColor(req.Status)}`}>
                        {req.Status}
                      </span>
                    </td>
                    <td className="p-4">
                      {req.IsEmergency ? (
                        <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-bold uppercase">Emergency</span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-4 border-l border-gray-100">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setSelectedRequest(req);
                            const properlyCasedStatus = req.Status ? req.Status.charAt(0).toUpperCase() + req.Status.slice(1).toLowerCase() : 'Pending';
                            setNewStatus(req.Status === 'InProgress' ? 'InProgress' : properlyCasedStatus);
                            setStatusModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-semibold transition-colors"
                        >
                          <Edit2 size={12} /> Status
                        </button>
                        
                        {req.Status === 'Approved' && (
                          <button 
                            onClick={() => {
                              setSelectedRequest(req);
                              setAssignModalOpen(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded text-xs font-semibold transition-colors"
                          >
                            <UserPlus size={12} /> Assign
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {statusModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Update Booking Status</h2>
              <button onClick={() => setStatusModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateStatus} className="p-6">
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-4">
                  Request <strong className="text-gray-800">#{selectedRequest.RequestID}</strong> - {selectedRequest.ServiceType}
                </p>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Status</label>
                <select 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {newStatus === 'Rejected' && (
                <div className="mb-6 animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rejection Reason</label>
                  <textarea 
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please explain why this booking is rejected..."
                    className="input-field min-h-[100px] resize-none"
                    required
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end mt-8">
                <button 
                  type="button" 
                  onClick={() => setStatusModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-lg transition-colors shadow-sm flex items-center gap-2"
                >
                  <Check size={16} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Mechanic Modal */}
      {assignModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Assign Mechanic</h2>
              <button onClick={() => setAssignModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAssignMechanic} className="p-6">
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-4">
                  Request <strong className="text-gray-800">#{selectedRequest.RequestID}</strong> - {selectedRequest.ServiceType}
                </p>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Mechanic</label>
                
                {mechanics.length === 0 ? (
                  <div className="p-4 bg-yellow-50 text-yellow-700 text-sm rounded border border-yellow-200">
                    No mechanics available in your garage. Please head to the "Mechanics" page to add one!
                  </div>
                ) : (
                  <select 
                    value={selectedMechanic}
                    onChange={(e) => setSelectedMechanic(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="" disabled>-- Select a mechanic --</option>
                    {mechanics.map(m => (
                      <option key={m.UserID} value={m.UserID}>
                        {m.FullName} ({m.Status})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-3 justify-end mt-8">
                <button 
                  type="button" 
                  onClick={() => setAssignModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={mechanics.length === 0}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:bg-gray-300 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                >
                  <UserPlus size={16} /> Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
