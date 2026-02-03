import React, { useState, useEffect, useRef } from 'react';

const AnimatedDigit = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [nextValue, setNextValue] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (value !== displayValue && !isAnimating) {
      setNextValue(value);
      setIsAnimating(true);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        setDisplayValue(value);
        setNextValue(null);
        setIsAnimating(false);
        timeoutRef.current = null;
      }, 400);
    }
  }, [value, displayValue, isAnimating]);

  return (
    <div className="digit-container">
      <div className={`digit-inner ${isAnimating ? 'animating' : ''}`}>
        <div className="digit-item">
          <span className="value">{displayValue}</span>
        </div>
        <div className="digit-item">
          <span className="value">{nextValue !== null ? nextValue : ''}</span>
        </div>
      </div>
    </div>
  );
};

const Timer = () => {
  const [initialTime, setInitialTime] = useState(5 * 60);
  const [timeInSeconds, setTimeInSeconds] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('countdown');
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      if (mode === 'countdown' && timeInSeconds <= 0) {
        setIsRunning(false);
        return;
      }

      timerRef.current = setInterval(() => {
        setTimeInSeconds((prevTime) => {
          if (mode === 'countdown') {
            return Math.max(0, prevTime - 1);
          } else {
            return prevTime + 1;
          }
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, mode, timeInSeconds]);

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
    setTimeInSeconds(mode === 'countdown' ? initialTime : 0);
  };

  const handleModeChange = (newMode) => {
    if (isRunning) return;
    setMode(newMode);
    setTimeInSeconds(newMode === 'countdown' ? initialTime : 0);
  };

  const adjustTimeDigit = (type, amount, multiplier) => {
    const totalAdjustment = amount * multiplier;
    setTimeInSeconds((prevTime) => {
      let hours = Math.floor(prevTime / 3600);
      let minutes = Math.floor((prevTime % 3600) / 60);
      let seconds = prevTime % 60;

      switch (type) {
        case 'h':
          hours = (hours + totalAdjustment + 100) % 100;
          break;
        case 'm':
          minutes = (minutes + totalAdjustment + 60) % 60;
          break;
        case 's':
          seconds = (seconds + totalAdjustment + 60) % 60;
          break;
        default:
          break;
      }

      const newTotalSeconds = hours * 3600 + minutes * 60 + seconds;
      const finalTime = Math.max(0, newTotalSeconds);
      if (mode === 'countdown') {
        setInitialTime(finalTime);
      }
      return finalTime;
    });
  };

  const { h1, h2, m1, m2, s1, s2 } = formatTimeDigits(timeInSeconds);

  const renderDigit = (value, type, multiplier) => {
    const hideControls = isRunning || mode === 'countup';
    return (
      <div className={`time-part ${isRunning ? 'running' : ''} ${hideControls ? 'hide-controls' : ''}`}>
        <button className="adjustment-button-top" onClick={() => adjustTimeDigit(type, 1, multiplier)}>
          <i className="fa-solid fa-plus"></i>
        </button>
        <AnimatedDigit value={parseInt(value, 10)} />
        <button className="adjustment-button-bottom" onClick={() => adjustTimeDigit(type, -1, multiplier)}>
          <i className="fa-solid fa-minus"></i>
        </button>
      </div>
    );
  };

  const handleClose = () => {
    if (window.electronAPI && window.electronAPI.closeFrontWindow) {
      window.electronAPI.closeFrontWindow();
    } else {
      window.close();
    }
  };

  return (
    <>
      <button className="close-window-button" onClick={handleClose}>
        <i className="fa-solid fa-xmark"></i>
      </button>
      <div className={`timer-tabs ${isRunning ? 'hidden' : ''}`}>
        <button 
          className={`tab-button ${mode === 'countdown' ? 'active' : ''}`}
          onClick={() => handleModeChange('countdown')}
        >
          倒计时
        </button>
        <button 
          className={`tab-button ${mode === 'countup' ? 'active' : ''}`}
          onClick={() => handleModeChange('countup')}
        >
          正计时
        </button>
      </div>
      <div className="time-display">
        {renderDigit(h1, 'h', 10)}
        {renderDigit(h2, 'h', 1)}
        <span className="time-separator">:</span>
        {renderDigit(m1, 'm', 10)}
        {renderDigit(m2, 'm', 1)}
        <span className="time-separator">:</span>
        {renderDigit(s1, 's', 10)}
        {renderDigit(s2, 's', 1)}
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
