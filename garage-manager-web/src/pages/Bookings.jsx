import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { useTranslation } from 'react-i18next';
import { Filter, Edit2, UserPlus, X, Check, Eye, Wrench, DollarSign, AlertCircle, Clock3, Search, CalendarDays, ArrowUpDown } from 'lucide-react';

export default function Bookings() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const userRole = user?.Role || user?.role;

  const [requests, setRequests] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestItems, setRequestItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Status Update State
  const [newStatus, setNewStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [depositPercentage, setDepositPercentage] = useState('');

  // Assign State
  const [selectedMechanic, setSelectedMechanic] = useState('');

  // Filters
  const [filter, setFilter] = useState('All');
  const [searchId, setSearchId] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterArrivalTime, setFilterArrivalTime] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, text: '', onConfirm: null, isAlert: false });

  const fetchRequests = useCallback(async () => {
    if (!user?.GarageID) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const params = {
        status: filter,
        page: currentPage,
        limit: limit,
        search: searchId,
        date: filterDate,
        arrivalTime: filterArrivalTime,
        sort: sortOrder
      };
      let response;
      if (userRole === 'GarageManager') {
        response = await api.get(`/services/garage/${user.GarageID}`, { params });
      } else {
        response = await api.get('/services/bookings', { params: { ...params, garageId: user.GarageID } });
      }
      setRequests(response.data.data);
      setTotalPages(response.data.totalPages);
      setTotalCount(response.data.total);
    } catch (err) {
      console.error(err);
      setError('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [user?.GarageID, userRole, filter, currentPage, searchId, filterDate, filterArrivalTime, sortOrder]);

  const fetchMechanics = useCallback(async () => {
    if (!user?.GarageID) return;
    try {
      const response = await api.get(`/users/garage/${user.GarageID}/mechanics`);
      setMechanics(response.data);
    } catch (err) {
      console.error(err);
    }
  }, [user?.GarageID]);

  const fetchServices = useCallback(async () => {
    if (!user?.GarageID) return;
    try {
      const response = await api.get(`/catalog/${user.GarageID}`);
      setServices(response.data);
    } catch (err) {
      console.error(err);
    }
  }, [user?.GarageID]);

  useEffect(() => {
    fetchRequests();
    fetchMechanics();
    fetchServices();

    const interval = setInterval(() => {
      
      fetchRequests();
    }, 30000); 

    return () => clearInterval(interval);
  }, [fetchRequests, fetchMechanics, fetchServices]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      if (newStatus === 'Rejected' && !rejectionReason.trim()) {
        setConfirmModal({ isOpen: true, text: "Please provide a rejection reason.", isAlert: true });
        return;
      }

      await api.put(`/services/${selectedRequest.RequestID}/status`, {
        status: newStatus,
        rejectionReason: newStatus === 'Rejected' ? rejectionReason : undefined,
        estimatedPrice: estimatedPrice ? parseFloat(estimatedPrice) : undefined,
        depositPercentage: depositPercentage ? parseInt(depositPercentage) : undefined
      });

      setStatusModalOpen(false);
      setSelectedRequest(null);
      setNewStatus('');
      setRejectionReason('');
      fetchRequests();
    } catch (err) {
      const apiError = err.response?.data?.error || err.response?.data?.errors?.join(', ') || err.response?.data?.message || err.message || 'Failed to update status';
      setConfirmModal({ isOpen: true, text: apiError, isAlert: true });
    }
  };

  const handleAssignMechanic = async (e) => {
    e.preventDefault();
    try {
      if (!selectedMechanic) {
        setConfirmModal({ isOpen: true, text: "Please select a mechanic.", isAlert: true });
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
      setConfirmModal({ isOpen: true, text: err.response?.data?.error || err.response?.data?.message || 'Failed to assign mechanic', isAlert: true });
    }
  };

  const handleViewDetails = async (req) => {
    setSelectedRequest(req);
    setDetailsModalOpen(true);
    setRequestItems([]);
    setLoadingItems(true);
    try {
      const response = await api.get(`/services/${req.RequestID}/items`);
      setRequestItems(response.data);
    } catch (err) {
      console.error('Failed to fetch request items', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleConfirmCash = (requestId) => {
    setConfirmModal({
      isOpen: true,
      text: 'Confirm that cash payment has been received?',
      onConfirm: async () => {
        try {
          await api.put(`/payments/confirm-cash/${requestId}`);
          fetchRequests();
          setConfirmModal({ isOpen: true, text: 'Cash payment confirmed!', isAlert: true });
        } catch (err) {
          setConfirmModal({ isOpen: true, text: err.response?.data?.error || 'Failed to confirm cash payment.', isAlert: true });
        }
      }
    });
  };

  const handleConfirmOnline = (requestId) => {
    setConfirmModal({
      isOpen: true,
      text: 'Confirm this online payment as received?',
      onConfirm: async () => {
        try {
          await api.put(`/payments/confirm-online/${requestId}`);
          fetchRequests();
          setConfirmModal({ isOpen: true, text: 'Online payment confirmed!', isAlert: true });
        } catch (err) {
          setConfirmModal({ isOpen: true, text: err.response?.data?.error || 'Failed to confirm online payment.', isAlert: true });
        }
      }
    });
  };

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'approved': return 'bg-indigo-100 text-indigo-700';
      case 'inprogress': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'cancelled': return 'bg-slate-200 text-slate-600 border border-slate-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchId, filterDate, filterArrivalTime, sortOrder]);

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-blue-600 bg-clip-text text-transparent">
            {t('bookings')}
          </h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Manage and track all garage service requests
          </p>
        </div>
      </div>

      {}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100/50 rounded-xl w-fit border border-gray-100">
        {['All', 'Pending', 'Approved', 'InProgress', 'Completed', 'Rejected', 'Cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === status
              ? 'bg-white text-[var(--color-primary)] shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            {status}
          </button>
        ))}
      </div>

      {}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col xl:flex-row items-center gap-4 transition-all hover:shadow-md group">
        {}
        <div className="relative flex-1 w-full lg:w-auto">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, Service, or Customer..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium placeholder:text-slate-400"
          />
        </div>

        {}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterDate('today')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterDate === 'today' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilterDate('week')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterDate === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Week
            </button>
          </div>

          {}
          <div className="relative group/date w-full sm:w-[150px]">
            <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors group-hover/date:text-blue-500" />
            <input
              type="date"
              value={filterDate && filterDate.includes('-') ? filterDate : ''}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium outline-none cursor-pointer"
            />
          </div>

          {/* Arrival Time Dropdown */}
          <div className="relative w-full sm:w-[140px]">
            <button
              onClick={() => setShowTimeDropdown(!showTimeDropdown)}
              className={`w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 border rounded-xl text-sm transition-all outline-none font-semibold ${filterArrivalTime
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'border-slate-100 text-slate-500 hover:bg-white hover:border-slate-300'
                }`}
            >
              <div className="flex items-center gap-2">
                <Clock3 size={16} className={filterArrivalTime ? 'text-blue-600' : 'text-slate-400'} />
                <span className="truncate">{filterArrivalTime || 'Any Time'}</span>
              </div>
              <Filter size={12} className={showTimeDropdown ? 'rotate-180 transition-transform' : ''} />
            </button>

            {showTimeDropdown && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-[200px] bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 p-3 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                  {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(time => (
                    <button
                      key={time}
                      onClick={() => { setFilterArrivalTime(time); setShowTimeDropdown(false); }}
                      className={`px-3 py-2 text-xs font-bold rounded-xl transition-all ${filterArrivalTime === time
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                        : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-100'
                        }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-slate-50">
                  <button
                    onClick={() => { setFilterArrivalTime(''); setShowTimeDropdown(false); }}
                    className="w-full py-1.5 text-[10px] uppercase font-black tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    Clear Time Filter
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sort Order */}
          <div className="w-full sm:w-[140px]">
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm hover:bg-white hover:border-blue-500 group/sort transition-all outline-none"
            >
              <div className="flex items-center gap-2">
                <ArrowUpDown size={16} className={sortOrder === 'asc' ? 'text-blue-600' : 'text-slate-400 group-hover/sort:text-blue-400'} />
                <span className="font-bold text-slate-700">{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
              </div>
            </button>
          </div>

          {/* Reset All */}
          {(searchId || filterDate || filterArrivalTime || sortOrder !== 'desc') && (
            <button
              onClick={() => { setSearchId(''); setFilterDate(''); setFilterArrivalTime(''); setSortOrder('desc'); }}
              className="p-2.5 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all border border-rose-100 flex items-center gap-2 font-bold text-xs shadow-sm hover:shadow active:scale-95"
              title="Reset Filters"
            >
              <X size={16} />
              <span className="lg:hidden xl:inline">Reset</span>
            </button>
          )}
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
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <Filter size={48} className="mb-4 opacity-20" />
            <p>{t('noBookingsFound')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-[var(--color-border)] text-sm text-[var(--color-text-light)]">
                  <th className="p-4 font-semibold">ID</th>
                  <th className="p-4 font-semibold">{t('serviceType')}</th>
                  <th className="p-4 font-semibold">{t('vehicle')}</th>
                  <th className="p-4 font-semibold">Schedule</th>
                  <th className="p-4 font-semibold">Location</th>
                  <th className="p-4 font-semibold">{t('mechanic')}</th>
                  <th className="p-4 font-semibold">{t('status')}</th>
                  <th className="p-4 font-semibold">Payment</th>
                  <th className="p-4 font-semibold border-l border-gray-100 w-[240px]">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {requests.map((req) => (
                  <tr key={req.RequestID} className="border-b border-[var(--color-border)] hover:bg-slate-50/50">
                    <td className="p-4 text-[var(--color-text-main)] font-mono">#{req.RequestID}</td>
                    <td className="p-4 text-[var(--color-text-main)] font-medium">
                      <div className="flex items-center gap-2">
                        <span>{req.ServiceType}</span>
                        {req.IsEmergency ? (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-bold uppercase">Emergency</span>
                        ) : null}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 truncate max-w-[200px]" title={req.Description}>
                        {req.Description}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      Vehicle #{req.VehicleID}
                    </td>
                    <td className="p-4">
                      {req.BookingDate ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">{new Date(req.BookingDate).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-500">{req.DropOffTime || 'Any Time'}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Unscheduled</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-600">{req.GarageLocation || '-'}</td>
                    <td className="p-4">
                      {req.AssignedMechanicName ? (
                        <span className="text-[var(--color-primary)] font-medium">{req.AssignedMechanicName}</span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded inline-flex font-semibold capitalize ${getStatusColor(req.Status)}`}>
                        {req.Status}
                      </span>
                    </td>
                    <td className="p-4">
                      {req.PaymentStatus === 'Completed' ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">✓ Paid ({req.PaymentMethod})</span>
                      ) : req.PaymentStatus === 'Pending' && req.PaymentMethod === 'Cash' ? (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold">💵 Cash Pending</span>
                      ) : req.PaymentStatus === 'Pending' ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">⏳ Processing</span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">—</span>
                      )}
                    </td>
                    <td className="p-4 border-l border-gray-100">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(req)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded text-xs font-semibold transition-colors"
                        >
                          <Eye size={12} /> Details
                        </button>

                        {userRole === 'GarageManager' && (
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setNewStatus('');
                              setStatusModalOpen(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-semibold transition-colors"
                          >
                            <Edit2 size={12} /> Status
                          </button>
                        )}

                        {userRole === 'GarageManager' && req.Status?.toLowerCase() !== 'completed' && req.Status?.toLowerCase() !== 'rejected' && req.Status?.toLowerCase() !== 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setAssignModalOpen(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded text-xs font-semibold transition-colors"
                          >
                            <UserPlus size={12} /> {req.AssignedMechanicName ? 'Change' : 'Assign'}
                          </button>
                        )}
                        {userRole === 'GarageManager' && req.Status?.toLowerCase() === 'pending' && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setConfirmModal({
                                isOpen: true,
                                text: 'You cannot manually assign a mechanic while the request is still pending. Please click the "Status" button to review and approve the request first.',
                                isAlert: true
                              });
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded text-xs font-semibold border border-rose-100 transition-colors"
                          >
                            <UserPlus size={12} /> Assign
                          </button>
                        )}

                        {userRole === 'Accountant' && req.PaymentMethod === 'Cash' && req.PaymentStatus === 'Pending' && (
                          <button
                            onClick={() => handleConfirmCash(req.RequestID)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-xs font-semibold transition-colors border border-amber-200"
                          >
                            <DollarSign size={12} /> Confirm Cash
                          </button>
                        )}

                        {userRole === 'Accountant' && req.PaymentMethod === 'Chapa' && req.PaymentStatus === 'Pending' && (
                          <button
                            onClick={() => handleConfirmOnline(req.RequestID)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-semibold transition-colors border border-indigo-200"
                          >
                            <Check size={12} /> Verify Online
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

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-[var(--color-border)] rounded-lg shadow-sm">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(currentPage * limit, totalCount)}</span> of{' '}
                <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <X size={20} className="rotate-90" /> {/* Using X as a placeholder for chevron, or better yet, Lucide icons if I had them easily */}
                  {/* Better: chevron-left icon if available. I see Lucide icons used. I'll use X as a temp or check Lucide list. */}
                  {/* Actually, I'll use simple text for now or Lucide names I know. */}
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${currentPage === i + 1
                      ? 'z-10 bg-[var(--color-primary)] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <X size={20} className="-rotate-90" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

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
                  <option value="" disabled>Select status</option>
                  {selectedRequest.Status?.toLowerCase() === 'pending' && (
                    <>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </>
                  )}
                  {selectedRequest.Status?.toLowerCase() === 'approved' && (
                    <>
                      <option value="InProgress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Rejected">Rejected</option>
                    </>
                  )}
                  {selectedRequest.Status?.toLowerCase() === 'inprogress' && (
                    <option value="Completed">Completed</option>
                  )}
                  {!['pending', 'approved', 'inprogress'].includes(selectedRequest.Status?.toLowerCase()) && (
                    <option value={selectedRequest.Status}>{selectedRequest.Status}</option>
                  )}
                </select>
              </div>

              {selectedRequest.IsEmergency && newStatus === 'Approved' && (
                <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start gap-3">
                    <DollarSign className="text-indigo-600 mt-1" size={18} />
                    <div>
                      <p className="text-sm font-bold text-indigo-900">Automatic Pricing Active</p>
                      <p className="text-xs text-indigo-700 mt-0.5"> The fixed price and deposit percentage from your <strong>Garage Settings</strong> will be applied automatically.</p>
                    </div>
                  </div>
                </div>
              )}

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
      {assignModalOpen && selectedRequest && (() => {
        // Parse the requested service types into an array for matching
        const requestedServices = (selectedRequest.ServiceType || '')
          .split(',')
          .map(s => s.trim().toLowerCase())
          .filter(Boolean);

        // Calculate match score for each mechanic
        const scoredMechanics = [...mechanics].map(m => {
          const skills = (m.Skills || []).map(s => s.toLowerCase());
          // Count how many requested services this mechanic has a matching skill for
          const matchedServices = requestedServices.filter(svc =>
            skills.some(skill => skill === svc || skill.includes(svc) || svc.includes(skill))
          );
          const matchCount = matchedServices.length;
          const matchRatio = requestedServices.length > 0 ? matchCount / requestedServices.length : 0;
          return {
            ...m,
            matchCount,
            matchRatio,
            matchedServices,
            matchLabel: requestedServices.length === 0 ? 'none'
              : matchRatio === 1 ? 'full'
                : matchCount > 0 ? 'partial'
                  : 'none'
          };
        });

        // Sort: full matches first, then partial (by count desc), then none. Active before inactive. Then by name.
        scoredMechanics.sort((a, b) => {
          // 1. Match score (descending)
          if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
          // 2. Active mechanics first
          if (a.Status === 'Active' && b.Status !== 'Active') return -1;
          if (a.Status !== 'Active' && b.Status === 'Active') return 1;
          // 3. Alphabetical
          return (a.FullName || '').localeCompare(b.FullName || '');
        });

        const bestMatchCount = scoredMechanics.length > 0 ? scoredMechanics[0].matchCount : 0;

        return (
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
                  <p className="text-sm text-gray-500 mb-2">
                    Request <strong className="text-gray-800">#{selectedRequest.RequestID}</strong> - {selectedRequest.ServiceType}
                    {selectedRequest.IsEmergency ? <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-bold uppercase">Emergency</span> : null}
                  </p>

                  {/* Skills required summary */}
                  {requestedServices.length > 0 && (
                    <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                      <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1.5">Skills Needed for This Service</p>
                      <div className="flex flex-wrap gap-1.5">
                        {requestedServices.map((svc, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">{selectedRequest.ServiceType.split(',').map(s => s.trim())[idx]}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Mechanic <span className="font-normal text-gray-400">(ranked by skill match)</span></label>

                  {mechanics.length === 0 ? (
                    <div className="p-4 bg-yellow-50 text-yellow-700 text-sm rounded border border-yellow-200">
                      No mechanics available in your garage. Please head to the "Mechanics" page to add one!
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
                      {scoredMechanics.map((m, idx) => {
                        const isSelected = String(selectedMechanic) === String(m.UserID);
                        const mechSkills = (m.Skills || []);
                        const matchBadge = m.matchLabel === 'full'
                          ? { text: `★ Best Match (${m.matchCount}/${requestedServices.length})`, cls: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200' }
                          : m.matchLabel === 'partial'
                            ? { text: `◐ Partial (${m.matchCount}/${requestedServices.length})`, cls: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200' }
                            : { text: 'No Match', cls: 'bg-gray-100 text-gray-500' };

                        // Determine row highlight
                        let rowHighlight = '';
                        if (isSelected) {
                          rowHighlight = 'border-[var(--color-primary)] bg-blue-50/50 ring-1 ring-[var(--color-primary)]';
                        } else if (m.matchLabel === 'full') {
                          rowHighlight = 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50';
                        } else if (m.matchLabel === 'partial') {
                          rowHighlight = 'border-amber-100 bg-amber-50/20 hover:bg-amber-50/40';
                        } else {
                          rowHighlight = 'border-transparent hover:bg-gray-50';
                        }

                        // Add a separator before "no match" group
                        const showSeparator = idx > 0 && m.matchCount === 0 && scoredMechanics[idx - 1].matchCount > 0;

                        return (
                          <React.Fragment key={m.UserID}>
                            {showSeparator && (
                              <div className="flex items-center gap-2 py-1 px-1">
                                <div className="flex-1 h-px bg-gray-200"></div>
                                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Other Mechanics</span>
                                <div className="flex-1 h-px bg-gray-200"></div>
                              </div>
                            )}
                            <label
                              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border ${rowHighlight}`}
                            >
                              <input
                                type="radio"
                                name="mechanic"
                                value={m.UserID}
                                checked={isSelected}
                                onChange={(e) => setSelectedMechanic(e.target.value)}
                                className="mt-1 accent-[var(--color-primary)]"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-sm text-gray-900">{m.FullName}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${m.Status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>{m.Status}</span>
                                  {requestedServices.length > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${matchBadge.cls}`}>{matchBadge.text}</span>
                                  )}
                                </div>
                                {mechSkills.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {mechSkills.map(skill => {
                                      const isMatch = m.matchedServices.some(svc => {
                                        const s = skill.toLowerCase();
                                        return s === svc || s.includes(svc) || svc.includes(s);
                                      });
                                      return (
                                        <span
                                          key={skill}
                                          className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${isMatch
                                            ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200'
                                            : 'bg-gray-100 text-gray-500'
                                            }`}
                                        >
                                          {isMatch ? '✓ ' : ''}{skill}
                                        </span>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-gray-400 mt-1 italic">No skills assigned</p>
                                )}
                              </div>
                            </label>
                          </React.Fragment>
                        );
                      })}
                    </div>
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
        );
      })()}

      {/* Details Modal */}
      {detailsModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
              <button onClick={() => setDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h3 className="font-bold text-lg text-slate-800 mb-1">#{selectedRequest.RequestID} - {selectedRequest.ServiceType}</h3>
                <p className="text-sm text-slate-500 mb-3">{selectedRequest.Description || 'No description provided.'}</p>
                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                  <div>
                    <span className="block text-slate-400 text-xs uppercase font-bold tracking-wider">Status</span>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(selectedRequest.Status)}`}>{selectedRequest.Status}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-xs uppercase font-bold tracking-wider">Mechanic</span>
                    <span className="block mt-1 font-semibold text-slate-700">{selectedRequest.AssignedMechanicName || 'Unassigned'}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200/60 mt-2">
                    <span className="block text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Payment Details</span>
                    {selectedRequest.PaymentMethod ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-700 font-medium">
                          Method: <span className="font-bold">{selectedRequest.PaymentMethod}</span> ({selectedRequest.PaymentStatus})
                        </span>
                        {selectedRequest.TransactionRef && (
                          <span className="text-slate-500 font-mono text-xs">Ref: {selectedRequest.TransactionRef}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500 font-medium italic">No payment initiated</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Invoice Breakdown */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-semibold text-slate-600">Item</th>
                      <th className="p-3 font-semibold text-slate-600 text-center">Qty</th>
                      <th className="p-3 font-semibold text-slate-600 text-right">Unit Price</th>
                      <th className="p-3 font-semibold text-slate-600 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Service line items */}
                    {(() => {
                      const serviceNames = selectedRequest.ServiceType ? selectedRequest.ServiceType.split(',').map(s => s.trim()) : [];
                      return serviceNames.map((svcName, idx) => {
                        const matchedSvc = services.find(s => s.ServiceName === svcName);
                        const price = matchedSvc ? Number(matchedSvc.Price) : 0;
                        return (
                          <tr key={`svc-${idx}`} className="bg-blue-50/30">
                            <td className="p-3 font-medium text-slate-800">
                              <span className="inline-flex items-center gap-1.5">
                                <Wrench size={14} className="text-blue-500" />
                                {svcName}
                              </span>
                            </td>
                            <td className="p-3 text-center text-slate-600 font-semibold">1</td>
                            <td className="p-3 text-right text-slate-600">{price.toLocaleString()} ETB</td>
                            <td className="p-3 text-right font-bold text-slate-800">{price.toLocaleString()} ETB</td>
                          </tr>
                        );
                      });
                    })()}

                    {/* Parts line items */}
                    {loadingItems ? (
                      <tr>
                        <td colSpan="4" className="p-6 text-center">
                          <span className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin inline-block"></span>
                        </td>
                      </tr>
                    ) : requestItems.length > 0 ? (
                      requestItems.map(item => (
                        <tr key={item.ItemID}>
                          <td className="p-3 font-medium text-slate-800">🔩 {item.ItemName}</td>
                          <td className="p-3 text-center text-slate-600 font-semibold">{item.QuantityUsed}</td>
                          <td className="p-3 text-right text-slate-600">{Number(item.SellingPrice).toLocaleString()} ETB</td>
                          <td className="p-3 text-right font-bold text-slate-800">
                            {(item.QuantityUsed * item.SellingPrice).toLocaleString()} ETB
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="p-3 text-center text-slate-400 italic text-xs">No parts used for this service</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    {(() => {
                      const serviceNames = selectedRequest.ServiceType ? selectedRequest.ServiceType.split(',').map(s => s.trim()) : [];
                      const serviceCost = serviceNames.reduce((sum, name) => {
                        const matched = services.find(s => s.ServiceName === name);
                        return sum + (matched ? Number(matched.Price) : 0);
                      }, 0);
                      const partsCost = requestItems.reduce((acc, curr) => acc + (curr.QuantityUsed * curr.SellingPrice), 0);
                      return (
                        <>
                          <tr>
                            <td colSpan="3" className="p-3 text-right font-bold text-slate-500 uppercase text-xs tracking-wider">Service Cost</td>
                            <td className="p-3 text-right font-bold text-slate-700">{serviceCost.toLocaleString()} ETB</td>
                          </tr>
                          <tr>
                            <td colSpan="3" className="p-3 text-right font-bold text-slate-500 uppercase text-xs tracking-wider border-t border-slate-100">Parts Cost</td>
                            <td className="p-3 text-right font-bold text-slate-700 border-t border-slate-100">{partsCost.toLocaleString()} ETB</td>
                          </tr>
                          <tr className="bg-blue-50/50">
                            <td colSpan="3" className="p-4 text-right font-black text-slate-800 uppercase text-sm tracking-wider border-t border-blue-100">Total Invoice</td>
                            <td className="p-4 text-right font-black text-blue-600 text-xl border-t border-blue-100">
                              {(serviceCost + partsCost).toLocaleString()} ETB
                            </td>
                          </tr>
                        </>
                      );
                    })()}
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Custom Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border ${confirmModal.isAlert ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                {confirmModal.isAlert ? <AlertCircle size={24} /> : <Check size={24} />}
              </div>
              <h3 className="text-lg font-bold text-center text-gray-900 mb-2">
                {confirmModal.isAlert ? 'Approval Required' : 'Confirm Action'}
              </h3>
              <p className="text-center text-gray-600 text-sm">{confirmModal.text}</p>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              {!confirmModal.isAlert && (
                <button
                  onClick={() => setConfirmModal({ isOpen: false, text: '', onConfirm: null, isAlert: false })}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                  else setConfirmModal({ isOpen: false, text: '', onConfirm: null, isAlert: false });
                }}
                className={`flex-1 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors cursor-pointer ${confirmModal.isAlert ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]'}`}
              >
                {confirmModal.isAlert ? 'Understood' : 'Yes, Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
