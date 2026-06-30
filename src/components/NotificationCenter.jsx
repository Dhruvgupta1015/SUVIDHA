/**
 * NotificationCenter.jsx — Live Notification Center for SUVIDHA
 *
 * Bell icon + badge + slide-out timeline feed.
 * Connects to socket urgentEvents + local state updates.
 * Works for Citizen, Officer, and Admin dashboards.
 *
 * Props:
 *   notifications: Array<{ id, title, body, type, time, read }>
 *   onClear: () => void
 *   onMarkRead: (id) => void
 */
import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, AlertTriangle, Zap, ShieldAlert, Clock, CheckCircle2, FileWarning } from 'lucide-react';

const TYPE_CONFIG = {
  emergency:  { icon: '🚨', color: 'border-l-red-500 bg-red-50',     label: 'Emergency',        iconComp: ShieldAlert,  iconColor: 'text-red-600' },
  critical:   { icon: '⚡', color: 'border-l-orange-500 bg-orange-50', label: 'Critical',         iconComp: Zap,          iconColor: 'text-orange-600' },
  escalation: { icon: '🔴', color: 'border-l-red-400 bg-red-50',      label: 'SLA Escalated',    iconComp: AlertTriangle, iconColor: 'text-red-500' },
  status:     { icon: '🔄', color: 'border-l-blue-500 bg-blue-50',    label: 'Status Updated',   iconComp: CheckCircle2, iconColor: 'text-blue-600' },
  evidence:   { icon: '📄', color: 'border-l-amber-500 bg-amber-50',  label: 'Evidence Update',  iconComp: FileWarning,  iconColor: 'text-amber-600' },
  info:       { icon: '📢', color: 'border-l-gray-400 bg-gray-50',    label: 'Info',             iconComp: Bell,         iconColor: 'text-gray-500' }
};

export const NotificationCenter = ({ notifications = [], onClear, onMarkRead }) => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Close on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition"
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-out panel */}
      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 animate-fade-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#1D4ED8] to-blue-500">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-white" />
              <span className="text-white font-bold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-white text-[#1D4ED8] text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={onClear}
                  className="text-blue-100 hover:text-white text-[10px] font-bold flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" /> Clear all
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-blue-100 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 space-y-2">
                <Bell className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="font-bold text-gray-500">All caught up!</p>
                <p>No notifications.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                const IconComp = cfg.iconComp;
                return (
                  <div
                    key={n.id}
                    onClick={() => onMarkRead?.(n.id)}
                    className={`flex items-start gap-3 px-4 py-3 border-l-4 cursor-pointer hover:brightness-95 transition ${cfg.color} ${!n.read ? 'opacity-100' : 'opacity-60'}`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-white border border-gray-100 mt-0.5`}>
                      <IconComp className={`w-4 h-4 ${cfg.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">{cfg.label}</span>
                        {!n.read && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-800 font-medium mt-0.5 leading-relaxed">{n.title}</p>
                      {n.body && <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>}
                      <div className="flex items-center gap-1 mt-1.5 text-[9px] text-gray-400">
                        <Clock className="w-2.5 h-2.5" />
                        {n.time ? new Date(n.time).toLocaleString('en-IN') : 'Just now'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 text-center">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''} — Socket live connected ●
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * useNotifications — Hook to manage notification state.
 * Converts urgentAlerts, status updates, evidence events → unified notification feed.
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    setNotifications(prev => [{
      id:   Date.now() + Math.random(),
      read: false,
      ...notification
    }, ...prev].slice(0, 50)); // keep max 50
  };

  const clearAll = () => setNotifications([]);

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return { notifications, addNotification, clearAll, markRead, markAllRead };
};

export default NotificationCenter;
