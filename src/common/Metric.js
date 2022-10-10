import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';

/** Sends current path to backend to update metrics */
export default function Metrics() {
  const { pathname } = useLocation();
  useEffect(() => {
    async function logPath() {
      try {
        await axios({
          method: 'POST',
          url: 'http://localhost:3001/metrics',
          params: { pathname },
          headers: { 'Content-Type': 'application/json' }
        });
      } catch {
        console.error("Failed to light the beacons of Gondor.");
      }
    }
    logPath();
  }, [pathname]);

  const styles = {
    position: "absolute",
    height: "1px",
    width: "1px",
    backgroundColor: "#00000000"
  };

  return <div style={styles}></div>;
}