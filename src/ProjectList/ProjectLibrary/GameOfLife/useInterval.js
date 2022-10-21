import { useEffect, useRef } from "react";

export function useInterval({callback, delay, board, clickable}) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!clickable) {
      function tick() {
        savedCallback.current();
      }
      if (delay !== null) {
        let interval = setInterval(tick, delay);
        return () => clearInterval(interval)
      }
    }
  }, delay, board, clickable)
}