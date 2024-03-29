import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLocalStorage } from "../../CustomHooks/useLocalStorage";
import axios from "axios";

/** Metrics
 *
 * This component has a lot going on. I wanted to keep it together
 * rather than abstracting parts out b/c It will be a useful one for
 * me to drag and drop into my other projects.
 *
 * 1) Checks local storage for token to dedupe users
 * 2) Sends current path to backend to update metrics
 *
 * */
export function Metrics() {

  const [token, setToken] = useLocalStorage("passerby");
  const { pathname } = useLocation();

  /** Hydration: monitors for change to token state */
  useEffect(function getLocalToken() {
    async function getToken() {
      if (!token) {
        let res = await axios.get('https://project-pith.herokuapp.com/metrics/token');
        setToken(res.data.token);
      }
    }
    getToken();
  }, [token, setToken]);

  /** Metrics: sends unique identifier and current endpoint to /metrics */
  useEffect(() => {
    async function logPath() {
      try {
        // might be a way to get endpoint from actual resource rather than physically sending it...
        //I would still need to monitor it the same way, but not send it as a param. Will check.
        let res = await axios({
          method: 'POST',
          url: 'https://project-pith.herokuapp.com/metrics',
          params: {
            pathname,
            token,
          },
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log("useEffect /metrics ", res.status);
      } catch {
        console.error("Failed to light the beacons of Gondor.");
      }
    }
    logPath();
  }, [pathname, token]);

  const styles = {
    position: "absolute",
    height: "1px",
    width: "1px",
    backgroundColor: "#00000000"
  };
  return <div style={styles}></div>;
}
