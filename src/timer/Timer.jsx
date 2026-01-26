import React, { useState, useEffect, useRef } from 'react';

const RollingDigit = ({ value }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      setIsAnimating(true);
    }
  }, [value, prevValue]);

  const handleTransitionEnd = (e) => {
    if (e.propertyName === 'transform') {
      setIsAnimating(false);
      setPrevValue(value);
    }
  };

  return (
    <div className="digit-container">
      <div 
        className="digit-strip" 
        onTransitionEnd={handleTransitionEnd}
        style={{ 
          transform: isAnimating ? 'translateY(-50%)' : 'translateY(0)',
          transition: isAnimating ? 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
        }}
      >
        <span className="value">{prevValue}</span>
        <span className="value">{value}</span>
      </div>
    </div>
  );
};

const Timer = () => {
  const [initialTime, setInitialTime] = useState(5 * 60);
  const [timeInSeconds, setTimeInSeconds] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRunning && timeInSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimeInSeconds((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeInSeconds === 0) {
      clearInterval(timerRef.current);
      setIsRunning(false);
      // Optionally add a sound or notification when timer reaches 0
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, timeInSeconds]);

  useEffect(() => {
    if (isRunning) {
      document.body.classList.add('timer-running');
    } else {
      document.body.classList.remove('timer-running');
    }
  }, [isRunning]);

  const formatTimeDigits = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    const s = String(seconds).padStart(2, '0');

    return {
      h1: h[0], h2: h[1],
      m1: m[0], m2: m[1],
      s1: s[0], s2: s[1],
    };
  };

  const handleStartPause = () => {
    setIsRunning((prevIsRunning) => !prevIsRunning);
  };

  const handleReset = () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
    setTimeInSeconds(initialTime);
  };

  const adjustDigit = (digitType, amount) => {
    setTimeInSeconds((prevTime) => {
      let totalSeconds = prevTime;

      let hours = Math.floor(totalSeconds / 3600);
      let minutes = Math.floor((totalSeconds % 3600) / 60);
      let seconds = totalSeconds % 60;

      switch (digitType) {
        case 'h1': // Tens of hours
          hours = (Math.floor(hours / 10) + amount + 10) % 10 * 10 + (hours % 10);
          break;
        case 'h2': // Single hours
          hours = Math.floor(hours / 10) * 10 + ((hours % 10) + amount + 10) % 10;
          break;
        case 'm1': // Tens of minutes (0-5)
          minutes = (Math.floor(minutes / 10) + amount + 6) % 6 * 10 + (minutes % 10);
          break;
        case 'm2': // Single minutes (0-9)
          minutes = Math.floor(minutes / 10) * 10 + ((minutes % 10) + amount + 10) % 10;
          break;
        case 's1': // Tens of seconds (0-5)
          seconds = (Math.floor(seconds / 10) + amount + 6) % 6 * 10 + (seconds % 10);
          break;
        case 's2': // Single seconds (0-9)
          seconds = Math.floor(seconds / 10) * 10 + ((seconds % 10) + amount + 10) % 10;
          break;
        default:
          break;
      }

      // Ensure hours don't exceed 99 (or some max, 2 digits implies 99)
      if (hours > 99) hours = 0; // Wrap around
      if (hours < 0) hours = 99; // Wrap around backwards

      // Ensure minutes and seconds are within 0-59
      // These checks are mostly for robustness if the digit logic has an edge case,
      // the modulo arithmetic should generally keep them in range.
      if (minutes >= 60) minutes %= 60; 
      if (minutes < 0) minutes = (minutes % 60 + 60) % 60;
      if (seconds >= 60) seconds %= 60;
      if (seconds < 0) seconds = (seconds % 60 + 60) % 60;


      const newTotalSeconds = hours * 3600 + minutes * 60 + seconds;
      const finalTime = Math.max(0, newTotalSeconds);
      setInitialTime(finalTime);
      return finalTime; // Ensure time doesn't go below zero
    });
  };

  const { h1, h2, m1, m2, s1, s2 } = formatTimeDigits(timeInSeconds);

  const renderDigitControls = (digitValue, digitType) => (
    <div className={`time-part ${isRunning ? 'running' : ''}`}>
      <button className="adjustment-button-top" onClick={() => adjustDigit(digitType, 1)}>
        <i className="fa-solid fa-plus"></i>
      </button>
      <RollingDigit value={parseInt(digitValue, 10)} />
      <button className="adjustment-button-bottom" onClick={() => adjustDigit(digitType, -1)}>
        <i className="fa-solid fa-minus"></i>
      </button>
    </div>
  );

  return (
    <>
      <div className="time-display">
        {renderDigitControls(h1, 'h1')}
        {renderDigitControls(h2, 'h2')}
        <span className="time-separator">:</span>
        {renderDigitControls(m1, 'm1')}
        {renderDigitControls(m2, 'm2')}
        <span className="time-separator">:</span>
        {renderDigitControls(s1, 's1')}
        {renderDigitControls(s2, 's2')}
      </div>
      <div className="control-buttons">
        <button onClick={handleStartPause} className={isRunning ? 'pause' : 'start'}>
          {isRunning ? <i className="fa-solid fa-pause"></i> : <i className="fa-solid fa-play"></i>}
        </button>
        <button onClick={handleReset} className="reset">
          <i className="fa-solid fa-rotate-left"></i>
        </button>
      </div>
    </>
  );
};

export default Timer;
