/**
 * DemoModePanel.jsx — Hackathon Demo Mode Engine for SUVIDHA
 *
 * Admin-only panel. Creates instant pre-seeded scenarios for judges.
 * No waiting. No manual data entry. Just one click.
 */
import React, { useState } from 'react';
import { adminAPI } from '../utils/api';
import { Zap, ShieldAlert, AlertTriangle, FileWarning, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

const SCENARIOS = [
  {
    key:         'emergency',
    icon:        '🚨',
    label:       'Emergency Case',
    desc:        'Transformer blast — live wires, electrocution risk. Emergency Response Unit auto-assigned.',
    color:       'bg-red-600 hover:bg-red-700',
    badge:       'bg-red-100 text-red-700 border-red-200',
    IconComp:    ShieldAlert
  },
  {
    key:         'suspicious',
    icon:        '⚠️',
    label:       'Suspicious Evidence',
    desc:        'Water complaint with 31% AI confidence document. Flagged for officer review.',
    color:       'bg-amber-600 hover:bg-amber-700',
    badge:       'bg-amber-100 text-amber-700 border-amber-200',
    IconComp:    FileWarning
  },
  {
    key:         'sla_breach',
    icon:        '🔴',
    label:       'SLA Breach Case',
    desc:        'Garbage complaint 80h old — auto-escalated, SLA Escalated status, admin alerted.',
    color:       'bg-orange-600 hover:bg-orange-700',
    badge:       'bg-orange-100 text-orange-700 border-orange-200',
    IconComp:    AlertTriangle
  },
  {
    key:         'critical_ai',
    icon:        '⚡',
    label:       'Critical AI Detection',
    desc:        'Gas leak + explosion risk — AI score 9/8+ → Critical Emergency auto-detected.',
    color:       'bg-purple-600 hover:bg-purple-700',
    badge:       'bg-purple-100 text-purple-700 border-purple-200',
    IconComp:    Zap
  },
  {
    key:         'reupload',
    icon:        '🔄',
    label:       'Re-upload Required',
    desc:        'Electricity connection with 72% confidence. Officer requested clearer document.',
    color:       'bg-blue-600 hover:bg-blue-700',
    badge:       'bg-blue-100 text-blue-700 border-blue-200',
    IconComp:    RefreshCw
  }
];

export const DemoModePanel = ({ onScenarioCreated }) => {
  const [loading, setLoading] = useState(null);  // which scenario is loading
  const [results, setResults] = useState({});     // key → { success, requestId, message }

  const handleSeed = async (scenario) => {
    setLoading(scenario);
    try {
      const res = await adminAPI.seedDemo(scenario);
      setResults(prev => ({
        ...prev,
        [scenario]: { success: true, requestId: res.data.requestId, message: res.data.message }
      }));
      onScenarioCreated?.(res.data);
    } catch (e) {
      setResults(prev => ({
        ...prev,
        [scenario]: { success: false, message: e.response?.data?.message || 'Scenario creation failed' }
      }));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="gov-card p-5 space-y-4 border-2 border-dashed border-purple-300 bg-purple-50/30">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-purple-200">
        <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h4 className="font-black text-gray-900 text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>
            🎬 Demo Mode Engine
          </h4>
          <p className="text-[10px] text-purple-700 font-medium">Instant hackathon scenarios — for judges</p>
        </div>
        <span className="ml-auto text-[9px] bg-purple-100 text-purple-700 border border-purple-200 font-black px-2 py-1 rounded-full animate-pulse">
          LIVE DEMO
        </span>
      </div>

      {/* Scenario buttons */}
      <div className="space-y-2.5">
        {SCENARIOS.map(s => {
          const result = results[s.key];
          const isLoading = loading === s.key;
          const IconComp = s.IconComp;
          return (
            <div key={s.key} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{s.icon}</span>
                  <span className="text-xs font-bold text-gray-900">{s.label}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
                {result && (
                  <div className={`mt-1.5 flex items-center gap-1 text-[10px] font-bold ${result.success ? 'text-green-700' : 'text-red-600'}`}>
                    {result.success
                      ? <><CheckCircle2 className="w-3 h-3" /> Created: {result.requestId}</>
                      : <><XCircle className="w-3 h-3" /> {result.message}</>
                    }
                  </div>
                )}
              </div>
              <button
                onClick={() => handleSeed(s.key)}
                disabled={isLoading}
                className={`flex items-center gap-1.5 px-3 py-2 text-white text-[10px] font-black rounded-xl transition flex-shrink-0 disabled:opacity-60 ${s.color}`}
              >
                {isLoading
                  ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating…</>
                  : <><IconComp className="w-3 h-3" /> Generate</>
                }
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-[9px] text-purple-500 text-center font-medium pt-1">
        All scenarios are real data in MongoDB. Socket alerts fire automatically.
      </p>
    </div>
  );
};

export default DemoModePanel;
