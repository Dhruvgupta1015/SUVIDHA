import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, CheckCircle2, UserCheck, RefreshCw, 
  AlertTriangle, FileWarning, Search, XCircle, ArrowRight
} from 'lucide-react';
import { adminAPI } from '../utils/api';

const ACTION_ICONS = {
  complaint_created: { icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-100' },
  evidence_uploaded: { icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-100' },
  evidence_approved: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100' },
  evidence_rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' },
  reupload_requested: { icon: RefreshCw, color: 'text-amber-500', bg: 'bg-amber-100' },
  status_updated: { icon: UserCheck, color: 'text-teal-500', bg: 'bg-teal-100' },
  sla_escalated: { icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-100' },
  emergency_triggered: { icon: ShieldAlert, color: 'text-purple-500', bg: 'bg-purple-100' },
  admin_override: { icon: ShieldAlert, color: 'text-gray-700', bg: 'bg-gray-200' },
};

const formatActionName = (action) => {
  if (!action) return 'Unknown Action';
  return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export const AuditPanel = () => {
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const [logsRes, metricsRes] = await Promise.all([
        adminAPI.getAuditLogs({ limit: 50 }),
        adminAPI.getAuditMetrics()
      ]);
      if (logsRes.data?.success) setLogs(logsRes.data.logs);
      if (metricsRes.data?.success) setMetrics(metricsRes.data.metrics);
    } catch (e) {
      console.error('Failed to fetch audit data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="gov-card p-4 flex flex-col justify-between">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Governance Score</p>
            <div className="flex items-end gap-2 mt-2">
              <span className={`text-3xl font-black ${metrics.governanceScore >= 80 ? 'text-emerald-600' : metrics.governanceScore >= 50 ? 'text-amber-500' : 'text-red-600'}`}>
                {metrics.governanceScore}/100
              </span>
            </div>
          </div>
          
          <div className="gov-card p-4 flex flex-col justify-between">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Most Escalated</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-rose-600">{metrics.mostEscalated}</span>
              <AlertTriangle className="w-5 h-5 text-rose-500 opacity-50" />
            </div>
          </div>

          <div className="gov-card p-4 flex flex-col justify-between">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Rejected Evidence</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-amber-600">{metrics.rejectedEvidence}</span>
              <FileWarning className="w-5 h-5 text-amber-500 opacity-50" />
            </div>
          </div>

          <div className="gov-card p-4 flex flex-col justify-between">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Emergencies</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-purple-600">{metrics.emergencyFrequency}</span>
              <ShieldAlert className="w-5 h-5 text-purple-500 opacity-50" />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audit Timeline */}
        <div className="lg:col-span-2 gov-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Global Audit Timeline
            </h3>
            <button onClick={fetchAuditData} className="text-gray-400 hover:text-blue-600 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {logs.map((log) => {
              const ActionIcon = ACTION_ICONS[log.action]?.icon || Activity;
              const colorClass = ACTION_ICONS[log.action]?.color || 'text-gray-500';
              const bgClass = ACTION_ICONS[log.action]?.bg || 'bg-gray-100';
              
              return (
                <div key={log._id} className="flex gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${bgClass}`}>
                    <ActionIcon className={`w-5 h-5 ${colorClass}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-gray-900">{formatActionName(log.action)}</p>
                      <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="font-semibold text-gray-800">{log.actorId?.name || (log.actorRole === 'system' ? 'System AI' : log.actorRole)}</span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                        {log.targetRequest?.requestId || 'Unknown Request'}
                      </span>
                    </div>
                    {Object.keys(log.metadata || {}).length > 0 && (
                      <div className="mt-2 text-[11px] font-mono text-gray-500 bg-white border border-gray-100 rounded p-2">
                        {JSON.stringify(log.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {logs.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">No audit logs found.</div>
            )}
          </div>
        </div>

        {/* Most Active Officers */}
        <div className="gov-card p-6 h-fit">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-6">
            <UserCheck className="w-5 h-5 text-blue-600" />
            Most Active Officers
          </h3>
          <div className="space-y-4">
            {metrics?.mostActiveOfficers?.map((officer, idx) => (
              <div key={officer._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{officer.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">{officer.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-blue-600">{officer.actionsCount}</span>
                  <p className="text-[9px] text-gray-400 uppercase">Actions</p>
                </div>
              </div>
            ))}
            
            {(!metrics?.mostActiveOfficers || metrics.mostActiveOfficers.length === 0) && (
              <div className="text-center py-8 text-gray-400 text-sm">No active officers.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
