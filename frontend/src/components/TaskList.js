import axios from 'axios';
import { useEffect, useState } from 'react';
import { useAuth } from '../App.jsx';
import API_BASE from '../config';

export default function TaskList() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API_BASE}/tasks/distributed`, { headers: { Authorization: `Bearer ${user.token}` } });
        // backend returns an array of group objects; be defensive
        const data = res.data;
        setGroups(Array.isArray(data) ? data : (data.groups || []));
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      }
    };
    if (user) fetch();
    const onChange = () => fetch();
    window.addEventListener('tasks:changed', onChange);
    return () => window.removeEventListener('tasks:changed', onChange);
  }, [user]);

  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      {groups.length === 0 && <div>No tasks distributed yet.</div>}
      {groups.map(g => (
        <div key={g.agent?._id || 'unassign'} style={{ border: '1px solid #ccc', padding: 8, marginBottom: 8 }}>
          <h4>{g.agent ? `${g.agent.name} (${g.agent.email} ${g.agent.mobile ? ' / ' + g.agent.mobile : g.agent.phone ? ' / ' + g.agent.phone : ''})` : 'Unassigned'}</h4>
          <ul>
            {g.tasks.map(t => (
              <li key={t.id}>{t.firstName} — {t.phone} — {t.notes}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
