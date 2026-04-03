import React from 'react';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import { usePolling } from '../hooks/usePolling';
import { fetchSessionsFeed } from '../api/api';

const SessionsList = () => {
  const { data: sessions, loading } = usePolling(fetchSessionsFeed, 10000);

  const columns = [
    { header: 'Session ID', accessor: 'session_id', render: (row) => <span className="font-mono text-xs">{row.session_id}</span> },
    { header: 'User', accessor: 'user_id' },
    { 
      header: 'Environment', 
      accessor: 'routing_state',
      render: (row) => (
        <Badge variant={row.routing_state === 'DECOY' ? 'red' : 'green'}>
          {row.routing_state}
        </Badge>
      )
    },
    { 
      header: 'Risk Score', 
      accessor: 'risk_score',
      render: (row) => (
        <span className={`${row.risk_score > 0.7 ? 'text-red-400' : row.risk_score > 0.3 ? 'text-yellow-400' : 'text-green-400'} font-semibold`}>
          {(row.risk_score * 100).toFixed(0)}%
        </span>
      )
    },
    { 
      header: 'Last Activity', 
      accessor: 'last_activity',
      render: (row) => <span className="text-gray-500 text-xs">{new Date(row.last_activity).toLocaleString()}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'cyan' : 'gray'}>
          {row.status.toUpperCase()}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Active Sessions</h1>
          <p className="text-gray-400 text-sm">Real-time view of authenticated identities and their routing states.</p>
        </div>
      </div>

      <Card noPadding>
        {loading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Loading sessions...</div>
        ) : (
          <DataTable 
            columns={columns} 
            data={sessions || []} 
            keyField="session_id" 
          />
        )}
      </Card>
    </div>
  );
};

export default SessionsList;
