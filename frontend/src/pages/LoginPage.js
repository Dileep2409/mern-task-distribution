// frontend/src/pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';

const LoginPage = () => {
    const [email, setEmail] = useState('admin@example.com'); // Default email for convenience
    const [password, setPassword] = useState('123456'); // Default password for convenience
    const [message, setMessage] = useState('');
    const { login, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!email || !password) {
            setMessage('Email aur Password dono bhariye.');
            return;
        }

        const result = await login(email, password);
        
        if (result.success) {
            // Redirect to dashboard
            navigate('/dashboard');
        } else {
            setMessage(result.message);
        }
    };

    return (
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl transition duration-500 hover:shadow-indigo-400/50">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Admin Login</h2>
            <p className="text-sm text-center text-indigo-600 mb-6 font-medium">
                Default: admin@example.com / 123456
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                        required
                        disabled={loading}
                    />
                </div>
                
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                        required
                        disabled={loading}
                    />
                </div>
                
                {message && (
                    <div className="p-3 text-sm font-medium text-red-700 bg-red-100 rounded-lg border border-red-300 text-center">
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-semibold text-white transition duration-200 ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'}`}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Logging In...
                        </>
                    ) : (
                        'Login'
                    )}
                </button>
            </form>
        </div>
    );
};

export default LoginPage;
