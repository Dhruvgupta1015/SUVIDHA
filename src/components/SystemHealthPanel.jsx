/**
 * SystemHealthPanel.jsx — Final System Health Panel for SUVIDHA
 *
 * T8: Real command center feel. Shows backend, socket, DB status, and live counts.
 */
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';
import { Activity, Server, Database, Users, AlertTriangle, ShieldAlert, Zap, Clock } from 'lucide-react';

export const SystemHealthPanel = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const res = await adminAPI.getHealth();
      setHealth(res.data.health);
    } catch (e) {
      console.error('Health fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading && !health) {
    return (
      <div className="gov-card p-6 flex justify-center items-center">
        <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!health) return null;

  const StatusIndicator = ({ status, label }) => (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${status === 'online' || status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
      <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">{label}: {status}</span>
    </div>
  );

  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="gov-card p-5 space-y-4 border border-blue-100 bg-gradient-to-br from-blue-50 to-white">
      <div className="flex items-center justify-between pb-2 border-b border-blue-100">
        <div className="flex items-center gap-2 text-blue-800">
          <Activity className="w-4 h-4" />
          <h4 className="section-label font-bold text-xs">System Health & Live Telemetry</h4>
        </div>
        <div className="flex gap-4">
          <StatusIndicator status={health.backend} label="API" />
          <StatusIndicator status={health.db} label="MongoDB" />
          <StatusIndicator status={health.redis} label="Redis" />
          <StatusIndicator status={health.socket} label="Socket.io" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="p-3 bg-white border border-gray-100 rounded-xl text-center">
          <Server className="w-4 h-4 mx-auto text-gray-400 mb-1" />
          <div className="text-sm font-black text-gray-800">{formatUptime(health.uptime)}</div>
          <div className="text-[9px] text-gray-500 font-bold uppercase">Socket Uptime</div>
        </div>
        
        <div className="p-3 bg-white border border-gray-100 rounded-xl text-center">
          <Activity className="w-4 h-4 mx-auto text-blue-500 mb-1" />
          <div className="text-sm font-black text-blue-700">{health.apiLatency}ms</div>
          <div className="text-[9px] text-blue-600 font-bold uppercase">API Latency</div>
        </div>

        <div className="p-3 bg-white border border-gray-100 rounded-xl text-center">
          <Database className="w-4 h-4 mx-auto text-teal-500 mb-1" />
          <div className="text-sm font-black text-teal-700">{health.dbLatency}ms</div>
          <div className="text-[9px] text-teal-600 font-bold uppercase">DB Latency</div>
        </div>

        <div className="p-3 bg-white border border-gray-100 rounded-xl text-center">
          <Zap className="w-4 h-4 mx-auto text-yellow-500 mb-1" />
          <div className="text-sm font-black text-yellow-700">{health.redisLatency}ms</div>
          <div className="text-[9px] text-yellow-600 font-bold uppercase">Redis Latency</div>
        </div>

        <div className="p-3 bg-white border border-red-100 rounded-xl text-center">
          <ShieldAlert className="w-4 h-4 mx-auto text-red-500 mb-1" />
          <div className="text-sm font-black text-red-700">{health.memPercent}%</div>
          <div className="text-[9px] text-red-600 font-bold uppercase">Memory Usage</div>
        </div>

        <div className="p-3 bg-white border border-orange-100 rounded-xl text-center">
          <AlertTriangle className="w-4 h-4 mx-auto text-orange-500 mb-1" />
          <div className="text-sm font-black text-orange-700">{health.cpuPercent}%</div>
          <div className="text-[9px] text-orange-600 font-bold uppercase">CPU Usage</div>
        </div>
      </div>
      <p className="text-right text-[8px] text-gray-400">Refreshes every 10s</p>
    </div>
  );
};

export default SystemHealthPanel;
