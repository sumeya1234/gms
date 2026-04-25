import React, { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { Check, DollarSign, Eye, RefreshCcw, Wrench, X } from 'lucide-react';

export default function AccountantPortal() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [services, setServices] = useState([]);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestItems, setRequestItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [rows, setRows] = useState([]);

  const fetchRows = useCallback(async () => {
    if (!user?.GarageID) return;
    try {
      setLoading(true);
      const response = await api.get('/services/bookings', {
        params: { garageId: user.GarageID, page: 1, limit: 50 }
      });
      setRows(response.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load accountant bookings.');
    } finally {
      setLoading(false);
    }
  }, [user?.GarageID]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const fetchServices = useCallback(async () => {
    if (!user?.GarageID) return;
    try {
      const response = await api.get(`/catalog/${user.GarageID}`);
      setServices(response.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [user?.GarageID]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const verifyPayment = async (req) => {
    const endpoint = req.PaymentMethod === 'Cash' ? 'confirm-cash' : 'confirm-online';
    try {
      setBusyId(req.RequestID);
      await api.put(`/payments/${endpoint}/${req.RequestID}`);
      await fetchRows();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Verification failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleViewDetails = async (req) => {
    setSelectedRequest(req);
    setDetailsModalOpen(true);
    setRequestItems([]);
    setLoadingItems(true);
    try {
      const response = await api.get(`/services/${req.RequestID}/items`);
      setRequestItems(response.data || []);
    } catch (err) {
      console.error('Failed to fetch request items', err);
    } finally {
      setLoadingItems(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-primary)]">Accountant Portal</h1>
          <p className="text-gray-500 mt-1">Financial verification and payment finalization</p>
        </div>
        <button onClick={fetchRows} className="btn-primary flex items-center gap-2 px-4 py-2">
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">{error}</div>}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-44">
            <span className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-[var(--color-border)] text-sm text-[var(--color-text-light)]">
                  <th className="p-4 font-semibold">Request</th>
                  <th className="p-4 font-semibold">Customer</th>
                  <th className="p-4 font-semibold">Vehicle</th>
                  <th className="p-4 font-semibold">Booking Status</th>
                  <th className="p-4 font-semibold">Payment</th>
                  <th className="p-4 font-semibold">Amount</th>
                  <th className="p-4 font-semibold">Verification</th>
                  <th className="p-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {(rows || []).map((req) => (
                  <tr key={req.RequestID} className="border-b border-[var(--color-border)] hover:bg-slate-50/60">
                    <td className="p-4 font-mono">#{req.RequestID}</td>
                    <td className="p-4 font-semibold text-gray-800">
                      {req.CustomerName || '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">
                          {req.VehicleModel || (req.VehicleID ? `Vehicle #${req.VehicleID}` : '-')}
                        </span>
                        <span className="text-xs text-gray-500">{req.VehiclePlateNumber || '-'}</span>
                      </div>
                    </td>
                    <td className="p-4">{req.Status}</td>
                    <td className="p-4">
                      {req.PaymentMethod ? `${req.PaymentMethod} (${req.PaymentStatus || 'Pending'})` : 'Not Initiated'}
                    </td>
                    <td className="p-4">
                      {`${Number(req.PaymentAmount || 0).toLocaleString()} ETB`}
                    </td>
                    <td className="p-4">
                      {req.PaymentStatus === 'Pending' && (req.PaymentMethod === 'Cash' || req.PaymentMethod === 'Chapa') ? (
                        <button
                          onClick={() => verifyPayment(req)}
                          disabled={busyId === req.RequestID}
                          className="px-3 py-1.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                        >
                          {busyId === req.RequestID ? (
                            <span className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-700 rounded-full animate-spin" />
                          ) : (
                            <>
                              {req.PaymentMethod === 'Cash' ? <DollarSign size={12} /> : <Check size={12} />}
                              Approve
                            </>
                          )}
                        </button>
                      ) : req.PaymentStatus === 'Completed' ? (
                        <span className="text-green-600 text-xs font-semibold">Verified</span>
                      ) : req.PaymentMethod ? (
                        <span className="text-gray-500 text-xs font-semibold">Awaiting Payment</span>
                      ) : (
                        <span className="text-gray-400 text-xs font-semibold">N/A</span>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleViewDetails(req)}
                        className="px-3 py-1.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors flex items-center gap-1"
                      >
                        <Eye size={12} /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailsModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Invoice Details</h2>
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
                    <span className="block text-slate-400 text-xs uppercase font-bold tracking-wider">Booking Status</span>
                    <span className="block mt-1 font-semibold text-slate-700">{selectedRequest.Status}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-xs uppercase font-bold tracking-wider">Payment</span>
                    <span className="block mt-1 font-semibold text-slate-700">{selectedRequest.PaymentMethod || 'Not Initiated'} ({selectedRequest.PaymentStatus || 'Pending'})</span>
                  </div>
                </div>
              </div>

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

                    {loadingItems ? (
                      <tr>
                        <td colSpan="4" className="p-6 text-center">
                          <span className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin inline-block"></span>
                        </td>
                      </tr>
                    ) : requestItems.length > 0 ? (
                      requestItems.map(item => (
                        <tr key={item.ItemID}>
                          <td className="p-3 font-medium text-slate-800">{item.ItemName}</td>
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
    </div>
  );
}
