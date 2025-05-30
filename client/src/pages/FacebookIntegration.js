import React, { useState, useEffect } from 'react';
import useFacebookSDK from '../hooks/useFacebookSDK';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const APP_ID = process.env.REACT_APP_FACEBOOK_APP_ID;

const FacebookIntegration = () => {
  useFacebookSDK(APP_ID);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fbPage, setFbPage] = useState(null);
  const token = localStorage.getItem('token');

  // Fetch current connection status on mount
  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/facebook/connect', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFbPage(res.data.fbPage);
      } catch (err) {
        setFbPage(null);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchPage();
  }, [token]);

  // connect to Facebook Page
  const handleConnect = () => {
    if (!window.FB) return alert('Facebook SDK not loaded');
    window.FB.login(
      function (response) {
        if (response.authResponse) {
          // getting the pages the user manages
          window.FB.api(
            '/me/accounts',
            'GET',
            {},
            async function (pageResponse) {
              if (pageResponse.data && pageResponse.data.length > 0) {
                const page = pageResponse.data[0]; 
                window.FB.api(
                  `/${page.id}/picture`,
                  'GET',
                  { redirect: false, type: 'square', height: 80, width: 80 },
                  async function (picRes) {
                    const pageData = {
                      id: page.id,
                      name: page.name,
                      accessToken: page.access_token,
                      picture: picRes.data?.url || '',
                    };
                    // Save to backend
                    try {
                      const res = await axios.post('http://localhost:5001/api/facebook/connect', pageData, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      setFbPage(res.data.fbPage);
                    } catch (err) {
                      alert('Failed to connect page.');
                    }
                  }
                );
              } else {
                alert('No Facebook pages found for this account.');
              }
            }
          );
        } else {
          alert('User cancelled login or did not fully authorize.');
        }
      },
      {
        scope:
          'public_profile,email,pages_manage_metadata,pages_messaging,pages_read_engagement,pages_show_list',
      }
    );
  };

  // Disconnect the page
  const handleDisconnect = async () => {
    try {
      await axios.delete('http://localhost:5001/api/facebook/connect', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFbPage(null);
    } catch (err) {
      alert('Failed to delete integration.');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#004E96] text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#004E96]">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md flex flex-col items-center">
        <h2 className="text-2xl font-semibold text-center mb-6">Facebook Page Integration</h2>
        {!loading && (
          fbPage && fbPage.id ? (
            <>
              <div className="mb-4 text-center">
                {fbPage.picture && (
                  <img src={fbPage.picture} alt={fbPage.name} className="mx-auto mb-2 rounded-full w-16 h-16 object-cover" />
                )}
                <div>
                  Integrated Page: <span className="font-bold">{fbPage.name}</span>
                </div>
              </div>
              <button
                className="btn w-full bg-red-500 hover:bg-red-600 text-white mb-3"
                onClick={handleDisconnect}
              >
                Delete Integration
              </button>
              <button
                className="btn btn-primary w-full "
                onClick={() => navigate('/')}
              >
                Reply To Messages
              </button>
            </>
          ) : (
            <button className="btn btn-primary w-full mt-2" onClick={handleConnect}>
              Connect Page
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default FacebookIntegration; 