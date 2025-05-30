// client/src/hooks/useFacebookSDK.js
import { useEffect } from 'react';

export default function useFacebookSDK(appId = process.env.REACT_APP_FACEBOOK_APP_ID, version = 'v18.0') {
  useEffect(() => {
    if (window.FB) return; // Already loaded
    window.fbAsyncInit = function () {
      window.FB.init({
        appId,
        cookie: true,
        xfbml: false,
        version,
      });
    };
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, [appId, version]);
}