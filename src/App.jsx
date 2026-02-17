import React, { useState, useEffect, useMemo } from 'react';
import { Plus, RefreshCw, Edit3, Check, X, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchSheetData, updateSheetRow, createSheetRow, deleteSheetRow } from './services/sheetService';

const App = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [newRow, setNewRow] = useState({ Date: '', Description: '', Timing: '', Status: '' });
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('desc');

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchSheetData();
      let lastDate = '';
      const processedResult = result.map(row => {
        if (row.Date && row.Date.trim() !== '') lastDate = row.Date;
        else row.Date = lastDate;
        return row;
      });
      setData(processedResult.filter(row => row.Date || row.Description || row.Timing || row.Status));
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const today = new Date();
    const formattedDate = `${today.getDate()} ${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()}`;
    setNewRow(prev => ({ ...prev, Date: formattedDate }));
  }, []);

  const filteredData = useMemo(() => {
    let result = [...data];
    if (searchTerm) result = result.filter(i => i.Description?.toLowerCase().includes(searchTerm.toLowerCase()));
    if (statusFilter !== 'All') result = result.filter(i => i.Status?.toLowerCase().includes(statusFilter.toLowerCase()));
    result.sort((a, b) => {
      const dateA = new Date(a.Date);
      const dateB = new Date(b.Date);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    return result;
  }, [data, searchTerm, statusFilter, sortOrder]);

  const handleAction = async (action, originalRow, val) => {
    const fullIdx = data.findIndex(d => d === originalRow);
    const sheetRowIndex = fullIdx + 2;

    if (action === 'delete' && !window.confirm('Delete this entry?')) return;

    let res;
    if (action === 'save') res = await updateSheetRow(sheetRowIndex, val);
    else if (action === 'delete') res = await deleteSheetRow(sheetRowIndex);
    else if (action === 'add') res = await createSheetRow(val);

    if (res.success) {
      if (action === 'save') {
        const newData = [...data];
        newData[fullIdx] = val;
        setData(newData);
        setEditingId(null);
      } else if (action === 'delete') {
        setData(prev => prev.filter((_, i) => i !== fullIdx));
      } else if (action === 'add') {
        setData(prev => [...prev, val]);
        setIsAdding(false);
        setNewRow({ ...newRow, Description: '', Timing: '', Status: '' });
      }
      showToast('Success');
    } else {
      showToast('Failed', 'error');
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <RefreshCw className="spinner" size={32} style={{ color: '#86868b' }} />
      </div>
    );
  }

  const completedCount = data.filter(d => d.Status?.toLowerCase().includes('comp')).length;

  return (
    <div className="container py-16">
      {/* Header */}
      <header style={{ marginBottom: '48px' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '48px' }}>
          <div>
            <h1 className="headline">Daily Log</h1>
            <p className="subheadline">Track your tasks with clarity and precision.</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setIsAdding(true)} className="btn">
              <Plus size={20} strokeWidth={2} />
              New Entry
            </button>
            <button onClick={loadData} className="icon-btn">
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats">
          <div className="stat">
            <div className="stat-label">Total Entries</div>
            <div className="stat-value">{data.length}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{completedCount}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{data.length - completedCount}</div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="toolbar">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search"
            className="search-input"
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-select">
            <option value="All">All</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
          </select>
          <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="filter-select">
            {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
          </button>
        </div>
      </header>

      {/* Task List */}
      <div>
        <AnimatePresence mode="popLayout">
          {filteredData.map((row) => {
            const fullIdx = data.indexOf(row);
            const isEditing = editingId === fullIdx;
            const isCompleted = row.Status?.toLowerCase().includes('comp');

            return (
              <motion.div
                key={fullIdx}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isEditing ? (
                  <div className="edit-card">
                    <div className="form-row" style={{ marginBottom: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Date</label>
                        <input
                          value={editValues.Date}
                          onChange={e => setEditValues({ ...editValues, Date: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Timing</label>
                        <input
                          value={editValues.Timing}
                          onChange={e => setEditValues({ ...editValues, Timing: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        value={editValues.Description}
                        onChange={e => setEditValues({ ...editValues, Description: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <input
                        value={editValues.Status}
                        onChange={e => setEditValues({ ...editValues, Status: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-between items-center" style={{ marginTop: '24px' }}>
                      <button onClick={() => handleAction('delete', row)} className="btn-link" style={{ color: '#d32f2f' }}>
                        Delete
                      </button>
                      <div className="flex gap-4">
                        <button onClick={() => setEditingId(null)} className="btn-link">
                          Cancel
                        </button>
                        <button onClick={() => handleAction('save', row, editValues)} className="btn">
                          <Check size={18} />
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="task-row">
                    <div className="task-content">
                      <div className="task-date">{row.Date}</div>
                      <div className="task-title">{row.Description}</div>
                      <div className="task-details">
                        <div className="task-time">
                          <Clock size={14} />
                          {row.Timing}
                        </div>
                        <span className={`badge ${isCompleted ? 'badge-completed' : 'badge-pending'}`}>
                          {row.Status}
                        </span>
                      </div>
                    </div>
                    <div className="task-meta">
                      <button
                        onClick={() => {
                          setEditingId(fullIdx);
                          setEditValues({ ...row });
                        }}
                        className="icon-btn"
                      >
                        <Edit3 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add Entry Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setIsAdding(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="modal"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="modal-title">New Entry</h2>
              <p className="modal-subtitle">Add a new task to your daily log.</p>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={newRow.Description}
                  onChange={e => setNewRow({ ...newRow, Description: e.target.value })}
                  placeholder="What are you working on?"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    value={newRow.Date}
                    onChange={e => setNewRow({ ...newRow, Date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Timing</label>
                  <input
                    value={newRow.Timing}
                    onChange={e => setNewRow({ ...newRow, Timing: e.target.value })}
                    placeholder="e.g. 10:00 AM"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <input
                  value={newRow.Status}
                  onChange={e => setNewRow({ ...newRow, Status: e.target.value })}
                  placeholder="e.g. Pending"
                />
              </div>

              <div className="form-actions">
                <button onClick={() => setIsAdding(false)} className="btn-link" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button onClick={() => handleAction('add', null, newRow)} className="btn" style={{ flex: 1 }}>
                  Add Entry
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`toast ${toast.type === 'error' ? 'toast-error' : ''}`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
