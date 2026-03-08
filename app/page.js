'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Wifi, WifiOff, AlertCircle, Package, DollarSign, Truck, Radio, History, Bell } from 'lucide-react';

export default function FilamentVault() {
  const [spools, setSpools] = useState([
    {
      id: 1,
      brand: 'Prusa',
      material: 'PLA',
      color: 'Galaxy Black',
      weight: 1000,
      diameter: 1.75,
      remaining: 850,
      nozzle: '200-230°C',
      bed: '60°C',
      price: 19.99,
      supplier: 'Prusa',
      purchaseDate: '2025-02-15',
      location: 'Shelf A1',
      nfcId: 'NFC001',
      userId: 'user1',
      createdAt: new Date().toISOString()
    }
  ]);

  const [usageHistory, setUsageHistory] = useState([]);
  const [currentUser, setCurrentUser] = useState({ id: 'user1', name: 'Honza' });
  const [isOnline, setIsOnline] = useState(true);
  const [modal, setModal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [nfcStatus, setNfcStatus] = useState('ready');
  const [showHistory, setShowHistory] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const materials = ['PLA', 'PETG', 'ABS', 'TPU', 'Nylon', 'ASA', 'PC', 'HIPS'];
  const suppliers = ['Prusa', 'MatterHackers', 'E3D', 'Fillamentum', 'ColorFabb', 'Prusament'];

  // Initialize on client side
  useEffect(() => {
    setIsClient(true);
    
    // Load from localStorage
    const savedSpools = localStorage.getItem('filament_spools');
    const savedHistory = localStorage.getItem('filament_history');
    
    if (savedSpools) {
      try {
        setSpools(JSON.parse(savedSpools));
      } catch (e) {
        console.error('Error loading spools:', e);
      }
    }
    
    if (savedHistory) {
      try {
        setUsageHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error loading history:', e);
      }
    }

    setIsOnline(navigator.onLine);
  }, []);

  // Save to localStorage whenever spools change
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('filament_spools', JSON.stringify(spools));
    }
  }, [spools, isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('filament_history', JSON.stringify(usageHistory));
    }
  }, [usageHistory, isClient]);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // NFC Reader
  const handleReadNFC = async () => {
    if (!('NDEFReader' in window)) {
      setNfcStatus('unsupported');
      alert('NFC not supported on this device. Use iPhone 13+ with iOS 16+');
      return;
    }

    try {
      setNfcStatus('scanning');
      const reader = new window.NDEFReader();
      await reader.scan();

      reader.onreading = (event) => {
        try {
          const decoder = new TextDecoder();
          for (const record of event.message.records) {
            const text = decoder.decode(record.data);
            const nfcData = JSON.parse(text);
            const foundSpool = spools.find(s => s.nfcId === nfcData.nfcId);
            if (foundSpool) {
              handleEditSpool(foundSpool);
              setNfcStatus('read');
              setTimeout(() => setNfcStatus('ready'), 2000);
            }
          }
        } catch (e) {
          setNfcStatus('error');
        }
      };

      reader.onreadingerror = () => {
        setNfcStatus('error');
        setTimeout(() => setNfcStatus('ready'), 2000);
      };
    } catch (error) {
      setNfcStatus('error');
      setTimeout(() => setNfcStatus('ready'), 2000);
    }
  };

  // NFC Writer
  const handleWriteNFC = async (spool) => {
    if (!('NDEFWriter' in window)) {
      setNfcStatus('unsupported');
      alert('NFC not supported on this device. Use iPhone 13+ with iOS 16+');
      return;
    }

    try {
      setNfcStatus('writing');
      const writer = new window.NDEFWriter();
      const nfcData = {
        nfcId: spool.nfcId,
        brand: spool.brand,
        material: spool.material,
        color: spool.color,
        remaining: spool.remaining,
        weight: spool.weight
      };

      await writer.write({
        records: [{
          recordType: 'text',
          data: JSON.stringify(nfcData)
        }]
      });

      setNfcStatus('written');
      setTimeout(() => setNfcStatus('ready'), 2000);
    } catch (error) {
      setNfcStatus('error');
      setTimeout(() => setNfcStatus('ready'), 2000);
    }
  };

  const handleAddSpool = () => {
    setFormData({
      brand: '',
      material: 'PLA',
      color: '',
      weight: 1000,
      diameter: 1.75,
      remaining: 1000,
      nozzle: '200°C',
      bed: '60°C',
      price: 0,
      supplier: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      location: '',
      nfcId: `NFC${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    });
    setEditingId(null);
    setModal('edit');
  };

  const handleEditSpool = (spool) => {
    setFormData(spool);
    setEditingId(spool.id);
    setModal('edit');
  };

  const handleSave = () => {
    if (editingId) {
      setSpools(spools.map(s => s.id === editingId ? { ...formData, id: editingId, userId: currentUser.id } : s));
    } else {
      setSpools([...spools, { ...formData, id: Date.now(), userId: currentUser.id, createdAt: new Date().toISOString() }]);
    }
    setModal(null);
  };

  const handleLogUsage = (spoolId) => {
    setFormData({ spoolId, used: 0, date: new Date().toISOString().split('T')[0], project: '' });
    setModal('usage');
  };

  const handleSaveUsage = () => {
    if (formData.used > 0) {
      setUsageHistory([...usageHistory, { id: Date.now(), ...formData }]);
      const spool = spools.find(s => s.id === formData.spoolId);
      if (spool) {
        const newRemaining = Math.max(0, spool.remaining - formData.used);
        setSpools(spools.map(s => s.id === formData.spoolId ? { ...s, remaining: newRemaining } : s));
      }
      setModal(null);
    }
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this spool?')) {
      setSpools(spools.filter(s => s.id !== id));
    }
  };

  const getStatusColor = (remaining, weight) => {
    const percentage = (remaining / weight) * 100;
    if (percentage === 0) return 'bg-red-100 text-red-800';
    if (percentage < 20) return 'bg-orange-100 text-orange-800';
    if (percentage < 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusLabel = (remaining, weight) => {
    const percentage = (remaining / weight) * 100;
    if (percentage === 0) return 'EMPTY';
    if (percentage < 20) return 'LOW';
    if (percentage < 50) return 'MEDIUM';
    return 'OK';
  };

  const filteredSpools = filterStatus === 'all' 
    ? spools 
    : spools.filter(s => {
        const pct = (s.remaining / s.weight) * 100;
        if (filterStatus === 'empty') return pct === 0;
        if (filterStatus === 'low') return pct > 0 && pct < 20;
        if (filterStatus === 'medium') return pct >= 20 && pct < 50;
        if (filterStatus === 'good') return pct >= 50;
        return true;
      });

  const lowStockSpools = spools.filter(s => (s.remaining / s.weight) < 0.2 && s.remaining > 0);
  const stats = {
    total: spools.length,
    empty: spools.filter(s => s.remaining === 0).length,
    lowStock: lowStockSpools.length,
    totalValue: spools.reduce((sum, s) => sum + (s.price || 0), 0),
    totalRemaining: spools.reduce((sum, s) => sum + s.remaining, 0)
  };

  if (!isClient) {
    return <div className="bg-slate-900 min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50 pb-20">
      {/* Header */}
      <div className="border-b border-slate-700/50 sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">FILAMENT VAULT</h1>
              <p className="text-xs text-slate-400">iOS Web App</p>
            </div>
            <div className="flex gap-2">
              {isOnline ? (
                <Wifi size={20} className="text-green-400" />
              ) : (
                <WifiOff size={20} className="text-red-400" />
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="bg-blue-500/20 rounded p-2 text-center">
              <p className="text-xs text-slate-400">Total</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </div>
            <div className="bg-red-500/20 rounded p-2 text-center">
              <p className="text-xs text-slate-400">Empty</p>
              <p className="text-lg font-bold">{stats.empty}</p>
            </div>
            <div className="bg-orange-500/20 rounded p-2 text-center">
              <p className="text-xs text-slate-400">Low</p>
              <p className="text-lg font-bold">{stats.lowStock}</p>
            </div>
            <div className="bg-green-500/20 rounded p-2 text-center">
              <p className="text-xs text-slate-400">Value</p>
              <p className="text-sm font-bold">${stats.totalValue.toFixed(0)}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleAddSpool}
              className="flex-1 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-2 rounded font-bold text-sm transition-colors"
            >
              <Plus size={16} />
              Add Spool
            </button>
            <button
              onClick={handleReadNFC}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded font-bold text-sm transition-colors ${
                nfcStatus === 'ready' ? 'bg-blue-500 hover:bg-blue-400 text-slate-950' : 'bg-slate-700 text-slate-300'
              }`}
            >
              <Radio size={16} />
              {nfcStatus === 'ready' ? 'Read NFC' : nfcStatus}
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {lowStockSpools.length > 0 && (
        <div className="bg-orange-500/20 border-l-4 border-orange-500 p-4 m-4 rounded">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-orange-300">{lowStockSpools.length} spools running low!</p>
              <p className="text-sm text-orange-200">{lowStockSpools.map(s => s.brand).join(', ')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav Tabs */}
      <div className="sticky top-20 bg-slate-900/80 border-b border-slate-700/50 px-4 py-2 flex gap-2 overflow-x-auto">
        <button
          onClick={() => { setShowHistory(false); setFilterStatus('all'); }}
          className={`px-4 py-2 rounded font-bold text-sm whitespace-nowrap transition-colors ${
            !showHistory ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Inventory
        </button>
        <button
          onClick={() => { setShowHistory(false); setFilterStatus('good'); }}
          className={`px-3 py-2 rounded font-bold text-sm whitespace-nowrap transition-colors ${
            !showHistory && filterStatus === 'good' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          ✓ In Stock
        </button>
        <button
          onClick={() => { setShowHistory(false); setFilterStatus('low'); }}
          className={`px-3 py-2 rounded font-bold text-sm whitespace-nowrap transition-colors ${
            !showHistory && filterStatus === 'low' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          ⚡ Low
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className={`px-3 py-2 rounded font-bold text-sm whitespace-nowrap flex items-center gap-1 transition-colors ${
            showHistory ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          <History size={16} />
          History
        </button>
      </div>

      <div className="px-4 py-6">
        {/* Inventory View */}
        {!showHistory ? (
          <div className="space-y-4">
            {filteredSpools.length === 0 ? (
              <div className="text-center py-12">
                <Package size={40} className="mx-auto text-slate-600 mb-2" />
                <p className="text-slate-400">No spools found</p>
              </div>
            ) : (
              filteredSpools.map((spool) => {
                const percentage = (spool.remaining / spool.weight) * 100;
                return (
                  <div
                    key={spool.id}
                    className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-cyan-400">{spool.brand}</h3>
                        <p className="text-xs text-slate-400">{spool.material} • {spool.color}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(spool.remaining, spool.weight)}`}>
                        {getStatusLabel(spool.remaining, spool.weight)}
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Remaining</span>
                        <span className="text-cyan-400 font-bold">{percentage.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            percentage > 50 ? 'bg-green-500' : percentage > 20 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{spool.remaining}g / {spool.weight}g</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div className="bg-slate-700/20 rounded p-2">
                        <p className="text-slate-400">Nozzle</p>
                        <p className="font-bold">{spool.nozzle}</p>
                      </div>
                      <div className="bg-slate-700/20 rounded p-2">
                        <p className="text-slate-400">Price</p>
                        <p className="font-bold">${spool.price.toFixed(2)}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mb-3">📍 {spool.location}</p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSpool(spool)}
                        className="flex-1 flex items-center justify-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 rounded text-sm font-bold transition-colors"
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleLogUsage(spool.id)}
                        className="flex-1 flex items-center justify-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 rounded text-sm font-bold transition-colors"
                      >
                        <History size={14} />
                        Log
                      </button>
                      <button
                        onClick={() => handleWriteNFC(spool)}
                        className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-sm font-bold transition-colors"
                      >
                        <Radio size={14} />
                        NFC
                      </button>
                      <button
                        onClick={() => handleDelete(spool.id)}
                        className="px-3 flex items-center justify-center bg-red-600/20 hover:bg-red-600/40 text-red-400 py-2 rounded text-sm font-bold transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* History View */
          <div className="space-y-3">
            {usageHistory.length === 0 ? (
              <div className="text-center py-12">
                <History size={40} className="mx-auto text-slate-600 mb-2" />
                <p className="text-slate-400">No usage history</p>
              </div>
            ) : (
              usageHistory.map((entry) => {
                const spool = spools.find(s => s.id === entry.spoolId);
                return (
                  <div key={entry.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-cyan-400">{spool?.brand} - {spool?.material}</p>
                        <p className="text-sm text-slate-400">{entry.project}</p>
                      </div>
                      <p className="text-sm text-orange-400 font-bold">-{entry.used}g</p>
                    </div>
                    <p className="text-xs text-slate-500">📅 {new Date(entry.date).toLocaleDateString()}</p>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {modal === 'edit' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-t border-slate-700/50 w-full rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">{editingId ? 'Edit Spool' : 'New Spool'}</h2>

            <div className="space-y-3 mb-6">
              {[
                { key: 'brand', label: 'Brand', type: 'text' },
                { key: 'material', label: 'Material', type: 'select', options: materials },
                { key: 'color', label: 'Color', type: 'text' },
                { key: 'remaining', label: 'Remaining (g)', type: 'number' },
                { key: 'weight', label: 'Total Weight (g)', type: 'number' },
                { key: 'price', label: 'Price ($)', type: 'number', step: '0.01' },
                { key: 'nozzle', label: 'Nozzle Temp', type: 'text' },
                { key: 'location', label: 'Location', type: 'text' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-bold text-slate-300 mb-1">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="">Select</option>
                      {field.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.key]: field.type === 'number' ? parseFloat(e.target.value) : e.target.value })}
                      step={field.step}
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setModal(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 rounded font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-2 rounded font-bold transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Usage Modal */}
      {modal === 'usage' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-t border-slate-700/50 w-full rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Log Filament Usage</h2>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">Filament Used (g)</label>
                <input
                  type="number"
                  value={formData.used || ''}
                  onChange={(e) => setFormData({ ...formData, used: parseFloat(e.target.value) })}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                  placeholder="e.g., 50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">Project Name</label>
                <input
                  type="text"
                  value={formData.project || ''}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                  placeholder="e.g., Benchy, Lithophane"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setModal(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 rounded font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUsage}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-2 rounded font-bold transition-colors"
              >
                Log Usage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}