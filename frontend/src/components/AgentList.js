import axios from 'axios';
import { useEffect, useState } from 'react';
import { useAuth } from '../App.jsx';

import API_BASE from '../config';

export default function AgentList() {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAgents = async () => {
      if (!user?.token) {
        setError('Not authenticated');
        return;
      }
      console.log('Fetching agents with token:', user?.token?.slice(0, 10) + '...');
      try {
        const res = await axios.get(`${API_BASE}/agents`, { headers: { Authorization: `Bearer ${user.token}` } });
        setAgents(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        const msg = err.response?.data?.message || err.message;
        console.error('Fetch agents error:', msg);
        setError(msg);
      }
    };
    if (user) fetchAgents();
    const onChange = () => fetchAgents();
    window.addEventListener('agents:changed', onChange);
    return () => window.removeEventListener('agents:changed', onChange);
  }, [user]);

  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h3>Agents ({agents.length})</h3>
      <ul>
        {agents.map(a => (
          <li key={a._id}>{a.name} — {a.email} — {a.mobile || a.phone || '—'}</li>
        ))}
      </ul>
    </div>
  );
}
