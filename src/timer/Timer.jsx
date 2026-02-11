import React, { useState, useEffect, useRef } from 'react';

const AnimatedDigit = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [nextValue, setNextValue] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef(null);
  const animationEndTimeoutRef = useRef(null);

  useEffect(() => {
    // If the target value is already what we're aiming for, do nothing
    const currentTarget = nextValue !== null ? nextValue : displayValue;
    if (value === currentTarget) return;

    if (isAnimating) {
      // INTERRUPT: Finish current animation immediately
      if (animationEndTimeoutRef.current) clearTimeout(animationEndTimeoutRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      setDisplayValue(nextValue);
      setNextValue(value);
      setIsAnimating(false);

      // Re-trigger animation in next tick
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(true);
        animationEndTimeoutRef.current = setTimeout(() => {
          setDisplayValue(value);
          setNextValue(null);
          setIsAnimating(false);
        }, 300);
      }, 20);
    } else {
      // START NEW: Normal animation flow
      setNextValue(value);
      setIsAnimating(true);

      if (animationEndTimeoutRef.current) clearTimeout(animationEndTimeoutRef.current);
      animationEndTimeoutRef.current = setTimeout(() => {
        setDisplayValue(value);
        setNextValue(null);
        setIsAnimating(false);
      }, 300);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (animationEndTimeoutRef.current) clearTimeout(animationEndTimeoutRef.current);
    };
  }, [value]);

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
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [autoHideSeconds, setAutoHideSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const checkOS = async () => {
      if (window.electronAPI && window.electronAPI.getOSInfo) {
        try {
          const info = await window.electronAPI.getOSInfo();
          // Windows 11 build number starts from 22000
          const isWin11 = info.platform === 'win32' && parseInt(info.release.split('.')[2]) >= 22000;
          
          if (!isWin11) {
            const root = document.getElementById('root');
            if (root) {
              // Increase background opacity for non-Win11 systems
              root.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            }
          }
        } catch (error) {
          console.error('Failed to get OS info:', error);
        }
      }
    };
    checkOS();

    const loadConfig = async () => {
      if (window.electronAPI && window.electronAPI.getConfig) {
        try {
          const config = await window.electronAPI.getConfig();
          if (config.timer && config.timer.auto_hide_seconds !== undefined) {
            setAutoHideSeconds(config.timer.auto_hide_seconds);
          }
        } catch (error) {
          console.error('Failed to load config:', error);
        }
      }
    };
    loadConfig();

    if (window.electronAPI && window.electronAPI.onConfigUpdated) {
      window.electronAPI.onConfigUpdated((newConfig) => {
        if (newConfig.timer && newConfig.timer.auto_hide_seconds !== undefined) {
          setAutoHideSeconds(newConfig.timer.auto_hide_seconds);
        }
      });
    }
  }, []);

  const toggleMiniMode = () => {
    const nextMiniMode = !isMiniMode;
    setIsMiniMode(nextMiniMode);
    
    if (window.electronAPI && window.electronAPI.resizeWindow) {
      // 获取当前窗口高度，计算新的 Y 坐标以保持视觉平衡
      const targetHeight = nextMiniMode ? 200 : 400;
      
      // 简单地让窗口在高度变化时，Y 坐标偏移一半的差值，
      // 这样窗口看起来是往中心缩小的，而不是往下长或者往上缩
      window.electronAPI.resizeWindow(600, targetHeight);
    }
  };

  useEffect(() => {
    let autoHideTimeout;
    
    const resetTimeout = () => {
      if (autoHideTimeout) clearTimeout(autoHideTimeout);
      if (isRunning && !isMiniMode && autoHideSeconds > 0) {
        autoHideTimeout = setTimeout(() => {
          toggleMiniMode();
        }, autoHideSeconds * 1000);
      }
    };

    // 初始化计时
    resetTimeout();

    // 监听用户操作
    const handleActivity = () => {
      resetTimeout();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    
    return () => {
      if (autoHideTimeout) clearTimeout(autoHideTimeout);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [isRunning, isMiniMode, autoHideSeconds]);

  useEffect(() => {
    if (isRunning) {
      if (mode === 'countdown' && timeInSeconds <= 0) {
        setIsRunning(false);
        // 倒计时结束，如果处于迷你模式则自动退出
        if (isMiniMode) {
          toggleMiniMode();
        }
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
  }, [isRunning, mode, timeInSeconds, isMiniMode]);

  useEffect(() => {
    if (isRunning) {
      document.body.classList.add('timer-running');
    } else {
      document.body.classList.remove('timer-running');
    }
  }, [isRunning]);

  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      if (isMiniMode) {
        root.classList.add('mini-mode');
      } else {
        root.classList.remove('mini-mode');
      }
    }
  }, [isMiniMode]);

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
    if (window.electronAPI && window.electronAPI.closeWindow) {
      window.electronAPI.closeWindow();
    } else {
      window.close();
    }
  };

  return (
    <div
      className={`timer-container ${isMiniMode ? 'mini-mode-container' : ''}`}
    >
      <button className="close-window-button" onClick={(e) => {
        e.stopPropagation(); // 防止触发父级的点击恢复逻辑
        handleClose();
      }}>
        <i className="fa-solid fa-xmark"></i>
      </button>
      {(isRunning || isMiniMode) && (
        <button 
          className="mini-mode-button" 
          onClick={(e) => {
            e.stopPropagation(); // 防止重复触发
            toggleMiniMode();
          }}
          title={isMiniMode ? "退出迷你模式" : "进入迷你模式"}
        >
          <i className={`fa-solid ${isMiniMode ? 'fa-expand' : 'fa-compress'}`}></i>
        </button>
      )}
      {!isMiniMode && (
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
      )}
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
      {!isMiniMode && (
        <div className="control-buttons">
          <button onClick={handleStartPause} className={isRunning ? 'pause' : 'start'}>
            {isRunning ? <i className="fa-solid fa-pause"></i> : <i className="fa-solid fa-play"></i>}
          </button>
          <button onClick={handleReset} className="reset">
            <i className="fa-solid fa-rotate-left"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default Timer;
