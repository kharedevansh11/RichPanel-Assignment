// client/src/hooks/useFacebookSDK.js
import { useEffect, useState } from 'react';

export default function useFacebookSDK(appId = process.env.REACT_APP_FACEBOOK_APP_ID, version = 'v18.0') {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (window.FB) {
      setIsInitialized(true);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId,
        cookie: true,
        xfbml: false,
        version,
      });
      setIsInitialized(true);
    };

    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.FB) {
        setIsInitialized(true);
      }
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [appId, version]);

  return isInitialized;
}