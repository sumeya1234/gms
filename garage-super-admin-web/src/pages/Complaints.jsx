import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, AlertTriangle, AlertCircle, CheckCircle, Search, MessageCircle } from 'lucide-react';
import { api } from '../lib/api';
import ComplaintMessageModal from '../components/complaints/ComplaintMessageModal';

export default function Complaints() {
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('escalated'); // 'escalated' or 'all'
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [search, setSearch] = useState('');

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const complaintsRes = await api.get(`/complaints/all`);
      setComplaints(complaintsRes.data || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch complaints', err);
      setError('Failed to load system complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleResolveComplaint = async (complaintId) => {
    try {
      await api.put(`/complaints/${complaintId}/resolve`, { status: 'Resolved' });
      showSuccess('Escalated complaint marked as officially resolved');
      setSelectedComplaint(null);
      fetchComplaints();
    } catch (err) {
      console.error('Failed to resolve complaint', err);
      alert(err.response?.data?.message || 'Failed to update complaint status');
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = 
      (c.CustomerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.GarageName || '').toLowerCase().includes(search.toLowerCase()) ||
      c.ComplaintID.toString().includes(search);
    
    const matchesTab = activeTab === 'all' 
      ? true 
      : c.IsEscalated === 1;

    return matchesSearch && matchesTab;
  });

  const escalatedCount = complaints.filter(c => c.IsEscalated === 1 && c.Status !== 'Resolved').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-[#1890ff] flex items-center gap-2">
            <AlertTriangle size={28} />
            System Complaints
          </h1>
          <p className="text-gray-500 mt-1">Monitor user grievances and handle severe escalations.</p>
        </div>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by ID, Customer, Garage..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-[#1890ff] focus:border-transparent transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
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
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'escalated'
              ? 'border-[#ef4444] text-[#ef4444]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('escalated')}
        >
          Escalated Issues
          {escalatedCount > 0 && (
            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
              {escalatedCount}
            </span>
          )}
        </button>
        <button
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-[#1890ff] text-[#1890ff]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('all')}
        >
          All Complaints ({complaints.length})
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <span className="w-8 h-8 border-4 border-[#1890ff] border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-gray-200 border-dashed shadow-sm">
            <AlertCircle size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">No complaints matching the criteria.</p>
          </div>
        ) : (
          <div className="overflow-hidden bg-white shadow-sm rounded-xl border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-sm xl:text-base text-gray-500">
                    <th className="p-4 font-semibold w-20">ID</th>
                    <th className="p-4 font-semibold w-24">Type</th>
                    <th className="p-4 font-semibold">Customer</th>
                    <th className="p-4 font-semibold">Garage</th>
                    <th className="p-4 font-semibold min-w-xs">Description</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredComplaints.map(complaint => (
                    <tr key={complaint.ComplaintID} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-gray-500 font-mono">#{complaint.ComplaintID}</td>
                      <td className="p-4">
                        {complaint.IsEscalated === 1 ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 font-bold text-[10px] uppercase rounded flex w-min items-center gap-1">
                            <AlertTriangle size={10} /> Escalate
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 font-bold text-[10px] uppercase rounded">
                            Standard
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-medium text-gray-900">
                        {complaint.CustomerName || `Customer #${complaint.CustomerID}`}
                      </td>
                      <td className="p-4 font-medium text-[#1890ff]">
                        {complaint.GarageName || `Garage #${complaint.GarageID}`}
                      </td>
                      <td className="p-4 text-gray-600">
                        <div className="max-w-xs truncate" title={complaint.Description}>
                          {complaint.Description}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded inline-flex font-semibold text-[10px] uppercase tracking-wide border ${
                          complaint.Status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-200' : 
                          complaint.Status === 'InProgress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                        }`}>
                          {complaint.Status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedComplaint(complaint)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-[#1890ff] hover:text-white rounded-md font-semibold text-xs transition-colors shadow-sm"
                        >
                          <MessageCircle size={14} />
                          {complaint.Status === 'Resolved' ? 'View Log' : 'Review'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedComplaint && (
        <ComplaintMessageModal 
          complaint={selectedComplaint} 
          onClose={() => setSelectedComplaint(null)} 
          onResolved={handleResolveComplaint}
        />
      )}
    </div>
  );
}
