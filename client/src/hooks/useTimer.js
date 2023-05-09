const { useState, useEffect } = require("react");

const SECOND = 1000;

function useTimer(deadline, interval = SECOND) {
  const [time, setTime] = useState(
    Math.max(0, new Date(deadline) - Date.now())
  );
  const [_deadline, setDeadline] = useState(deadline);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime((_time) => Math.max(0, _time - interval));
    }, interval);

    return () => clearInterval(intervalId);
  }, [interval]);

  useEffect(() => {
    setTime(Math.max(0, new Date(_deadline) - Date.now()));
  }, [_deadline]);

  return {
    seconds: Math.floor(time / SECOND),
    setDeadline,
  };
}

export default useTimer;
