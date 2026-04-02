import React from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { RiskTrendChart } from '../components/ui/Charts';
import { usePolling } from '../hooks/usePolling';
import { fetchForensicsSummary, fetchDecoyInteractions } from '../api/api';
import { Activity, ShieldAlert, Crosshair, Server } from 'lucide-react';

const Overview = () => {
  const { data: summary, loading: summaryLoading } = usePolling(fetchForensicsSummary, 60000);
  const { data: interactions, loading: interactionsLoading } = usePolling(fetchDecoyInteractions, 15000);

  const stats = [
    { label: 'Active Sessions', value: summary?.total_sessions || '--', icon: <Activity size={20} className="text-blue-400" /> },
    { label: 'High Risk', value: summary?.high_risk_sessions || '--', icon: <ShieldAlert size={20} className="text-red-500" /> },
    { label: 'Active Decoys', value: summary?.active_decoys || '--', icon: <Server size={20} className="text-purple-400" /> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Platform Overview</h1>
          <p className="text-gray-400 text-sm">Post-authentication threat intelligence and routing metrics.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="flex items-center p-6" noPadding>
            <div className="p-4 rounded-full bg-white/5 border border-white/5 mr-5">
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
              <h3 className="text-3xl font-bold text-white mt-1">{summaryLoading ? '...' : stat.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2">
          <Card title="Average Session Risk Lifecycle" className="h-full">
            <div className="pt-2">
              <RiskTrendChart />
            </div>
          </Card>
        </div>

        {/* Live Feed */}
        <div className="lg:col-span-1">
          <Card title="Recent Decoy Interactions" glow>
            <div className="space-y-4">
              {interactionsLoading ? (
                <div className="text-gray-500 text-sm animate-pulse">Waiting for telemetry...</div>
              ) : (
                interactions?.map((item, i) => (
                  <div key={i} className="flex items-start pb-4 border-b border-white/5 last:border-0 last:pb-0">
                    <div className="mt-1 mr-3 text-red-400">
                      <Crosshair size={16} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold">{item.session_id}</span>
                        <Badge variant="red" className="text-[10px] px-1.5 py-0">DECOY</Badge>
                      </div>
                      <p className="text-xs text-gray-300 mt-1">
                        <span className="text-gray-500">Action:</span> {item.action} <br />
                        <span className="text-gray-500">Target:</span> {item.target}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-1">{new Date(item.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Overview;
