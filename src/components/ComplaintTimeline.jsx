/**
 * ComplaintTimeline.jsx — Full Visual Timeline for SUVIDHA
 *
 * Shows the lifecycle of a complaint from creation to resolution.
 * Displayed in ComplaintTracking.jsx.
 *
 * Props: request (full request object)
 */
import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, Clock, FileCheck, UserCheck, ArrowUpCircle,
  AlertTriangle, XCircle, RefreshCw, ShieldAlert, FileWarning, Activity, ArrowRight
} from 'lucide-react';
import { requestAPI } from '../utils/api';

const STATUS_COLOR = {
  Pending:     'bg-yellow-100 border-yellow-300 text-yellow-700',
  'In-Progress': 'bg-blue-100 border-blue-300 text-blue-700',
  Approved:    'bg-green-100 border-green-300 text-green-700',
  Rejected:    'bg-red-100 border-red-300 text-red-700',
  Completed:   'bg-emerald-100 border-emerald-300 text-emerald-700'
};

const buildTimeline = (request) => {
  const steps = [];

  // Step 1: Complaint Created
  steps.push({
    id:        'created',
    label:     'Complaint Registered',
    sublabel:  `${request.serviceType?.toUpperCase()} — ${request.subService}`,
    icon:      CheckCircle2,
    iconColor: 'text-blue-600',
    dot:       'bg-blue-600',
    time:      request.createdAt,
    done:      true,
    detail:    request.isEmergency
      ? '🚨 Emergency fast-lane — bypassed normal queue'
      : `AI Priority: ${request.priority} (Score: ${request.priorityScore || 0})`
  });

  // Step 2: AI Analysis
  steps.push({
    id:        'ai',
    label:     'AI Intelligence Analysis',
    sublabel:  request.priorityReason || 'No urgency keywords detected',
    icon:      ShieldAlert,
    iconColor: 'text-indigo-600',
    dot:       'bg-indigo-600',
    time:      request.createdAt,
    done:      true,
    detail:    `Routed to ${request.assignedDepartment} — ${Math.round((request.routingConfidence || 0.65) * 100)}% confidence`
  });

  // Step 3: Evidence Submitted (if any)
  if (request.documents?.length > 0) {
    const allVerified = request.documents.every(d => d.verified);
    const hasFlagged  = request.documents.some(d => d.flagged);
    steps.push({
      id:        'evidence',
      label:     'Evidence Submitted',
      sublabel:  `${request.documents.length} document${request.documents.length !== 1 ? 's' : ''} uploaded`,
      icon:      hasFlagged ? FileWarning : FileCheck,
      iconColor: hasFlagged ? 'text-amber-600' : allVerified ? 'text-green-600' : 'text-blue-500',
      dot:       hasFlagged ? 'bg-amber-500' : allVerified ? 'bg-green-500' : 'bg-blue-400',
      time:      request.createdAt,
      done:      true,
      detail:    hasFlagged
        ? `⚠️ ${request.documents.filter(d => d.flagged).length} document(s) flagged as suspicious`
        : allVerified ? '✅ All documents AI-verified' : 'Under officer review'
    });
  }

  // Step 4: Officer Assigned / In-Progress
  if (['In-Progress', 'Approved', 'Rejected', 'Completed'].includes(request.status)) {
    steps.push({
      id:        'assigned',
      label:     'Officer Assigned',
      sublabel:  request.assignedTeam !== 'Unassigned' ? request.assignedTeam : request.assignedDepartment,
      icon:      UserCheck,
      iconColor: 'text-teal-600',
      dot:       'bg-teal-600',
      time:      request.updatedAt,
      done:      true,
      detail:    `Department: ${request.assignedDepartment}`
    });
  }

  // Step 5: SLA Escalation (if triggered)
  if (request.slaStatus === 'Escalated' || request.escalatedAt) {
    steps.push({
      id:        'escalated',
      label:     'SLA Escalated',
      sublabel:  'Complaint exceeded 72-hour resolution deadline',
      icon:      AlertTriangle,
      iconColor: 'text-red-600',
      dot:       'bg-red-600',
      time:      request.escalatedAt,
      done:      true,
      detail:    '🔴 Auto-escalated — Admin notified. Immediate action required.'
    });
  }

  // Step 6: Status Updated (Approved / Rejected)
  if (request.status === 'Approved' || request.status === 'Rejected') {
    steps.push({
      id:        'decision',
      label:     request.status === 'Approved' ? 'Request Approved' : 'Request Rejected',
      sublabel:  request.remarks || 'Officer decision recorded',
      icon:      request.status === 'Approved' ? ArrowUpCircle : XCircle,
      iconColor: request.status === 'Approved' ? 'text-green-600' : 'text-red-600',
      dot:       request.status === 'Approved' ? 'bg-green-600' : 'bg-red-600',
      time:      request.updatedAt,
      done:      true,
      detail:    request.remarks ? `Remarks: "${request.remarks}"` : null
    });
  }

  // Step 7: Completed
  if (request.status === 'Completed') {
    steps.push({
      id:        'completed',
      label:     'Resolved & Completed',
      sublabel:  'Civic service request successfully addressed',
      icon:      CheckCircle2,
      iconColor: 'text-emerald-600',
      dot:       'bg-emerald-600',
      time:      request.updatedAt,
      done:      true,
      detail:    '✅ Thank you for using SUVIDHA. We value your feedback.'
    });
  }

  // Pending future steps
  if (!['Completed', 'Rejected'].includes(request.status)) {
    steps.push({
      id:        'pending_resolution',
      label:     'Awaiting Resolution',
      sublabel:  'Complaint under active review',
      icon:      Clock,
      iconColor: 'text-gray-400',
      dot:       'bg-gray-300',
      time:      null,
      done:      false,
      detail:    null
    });
  }

  return steps;
};

export const ComplaintTimeline = ({ request }) => {
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'audit'
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    if (request && request.requestId) {
      setLoadingAudit(true);
      requestAPI.getComplaintAuditLogs(request.requestId)
        .then(res => {
          if (res.data?.success) setAuditLogs(res.data.logs);
        })
        .catch(err => console.error('Failed to fetch audit logs', err))
        .finally(() => setLoadingAudit(false));
    }
  }, [request]);

  if (!request) return null;
  const steps = buildTimeline(request);

  const formatActionName = (action) => {
    if (!action) return 'Unknown Action';
    return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const ACTION_ICONS = {
    complaint_created: { icon: CheckCircle2, color: 'text-blue-500', dot: 'bg-blue-500' },
    evidence_uploaded: { icon: Activity, color: 'text-indigo-500', dot: 'bg-indigo-500' },
    evidence_approved: { icon: CheckCircle2, color: 'text-emerald-500', dot: 'bg-emerald-500' },
    evidence_rejected: { icon: XCircle, color: 'text-red-500', dot: 'bg-red-500' },
    reupload_requested: { icon: RefreshCw, color: 'text-amber-500', dot: 'bg-amber-500' },
    status_updated: { icon: UserCheck, color: 'text-teal-500', dot: 'bg-teal-500' },
    sla_escalated: { icon: AlertTriangle, color: 'text-rose-500', dot: 'bg-rose-500' },
    emergency_triggered: { icon: ShieldAlert, color: 'text-purple-500', dot: 'bg-purple-500' },
    admin_override: { icon: ShieldAlert, color: 'text-gray-700', dot: 'bg-gray-700' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
          <span className="section-label text-gray-500">Complaint Lifecycle</span>
        </div>
        
        {/* Toggle View */}
        <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
          <button 
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${viewMode === 'timeline' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Simplified
          </button>
          <button 
            onClick={() => setViewMode('audit')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${viewMode === 'audit' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Audit Trail
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-200" />

        <div className="space-y-4">
          {viewMode === 'timeline' ? (
            steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-start gap-3 relative">
                  {/* Dot */}
                  <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-white shadow-sm z-10 ${step.done ? step.dot : 'bg-gray-200'}`}>
                    <Icon className={`w-3 h-3 ${step.done ? 'text-white' : 'text-gray-400'}`} />
                  </div>

                  {/* Content */}
                  <div className={`flex-1 pb-1 ${!step.done ? 'opacity-40' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-xs font-bold ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{step.sublabel}</p>
                        {step.detail && (
                          <p className={`text-[10px] mt-1 font-medium ${step.iconColor}`}>{step.detail}</p>
                        )}
                      </div>
                      {step.time && (
                        <span className="text-[9px] text-gray-400 flex-shrink-0 mt-0.5">
                          {new Date(step.time).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <>
              {loadingAudit ? (
                <div className="py-4 text-center">
                  <RefreshCw className="w-4 h-4 animate-spin text-gray-400 mx-auto" />
                </div>
              ) : (
                auditLogs.map((log, idx) => {
                  const actionData = ACTION_ICONS[log.action] || { icon: Activity, color: 'text-gray-500', dot: 'bg-gray-500' };
                  const Icon = actionData.icon;
                  return (
                    <div key={log._id} className="flex items-start gap-3 relative">
                      <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-white shadow-sm z-10 ${actionData.dot}`}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex justify-between items-start">
                          <p className={`text-xs font-bold ${actionData.color}`}>{formatActionName(log.action)}</p>
                          <span className="text-[9px] text-gray-400 font-medium">
                            {new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-500">
                          <span className="font-semibold text-gray-700">{log.actorId?.name || (log.actorRole === 'system' ? 'System AI' : log.actorRole)}</span>
                          <span className="text-gray-400">({log.actorRole})</span>
                        </div>
                        {Object.keys(log.metadata || {}).length > 0 && (
                          <div className="mt-1.5 p-1.5 bg-gray-50 border border-gray-100 rounded text-[9px] font-mono text-gray-500 overflow-x-auto">
                            {JSON.stringify(log.metadata)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintTimeline;
