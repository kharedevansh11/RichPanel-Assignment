import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', {
        email: form.email,
        password: form.password,
      });

      console.log('Login successful, response data:', res.data);

      auth.login(res.data.token, res.data.user);
      toast.success('Login successful!');
      navigate('/facebook-integration');
    } catch (err) {
      console.error('Login error:', err.response || err);
      toast.error(
        err.response?.data?.message ||
        (err.response?.data?.errors ? err.response.data.errors[0].msg : 'Login failed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#004E96]">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-6">Login to your account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p>Email</p>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
          <div>
            <p>Password</p>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
          <div className="flex items-center">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              checked={form.remember}
              onChange={handleChange}
              className="mr-2"
            />
            <label htmlFor="remember" className="text-sm">Remember Me</label>
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full mt-2"
            disabled={loading}
          >
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </form>
        <p className="text-center text-sm mt-4">
          New to my MyApp?{' '}
          <Link to="/register" className="text-primary-700 hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
