import axios from 'axios';
import { useState } from 'react';
import { useAuth } from '../App.jsx';

import API_BASE from '../config';

export default function CSVUpload() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return setMessage({ type: 'error', text: 'Please select a file' });
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await axios.post(`${API_BASE}/tasks/upload`, form, {
        headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ type: 'success', text: res.data.message });
      // notify TaskList to refresh
      window.dispatchEvent(new CustomEvent('tasks:changed'));
    } catch (err) {
      console.error('CSVUpload error', err);
      setMessage({ type: 'error', text: err.response?.data?.message || err.message });
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
      {message && <div style={{ color: message.type === 'error' ? 'red' : 'green' }}>{message.text}</div>}
      <input type="file" accept=".csv,.xlsx,.xls" onChange={e => setFile(e.target.files[0])} />
      <button type="submit">Upload and Distribute</button>
    </form>
  );
}
