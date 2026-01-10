const { app, shell, screen, ipcMain } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const fs = require('fs');

/**
 * 从 URI 协议中解析出关联的可执行文件路径
 */
function getExePathFromProtocol(protocol) {
    try {
        const regPath = `HKEY_CLASSES_ROOT\\${protocol}\\shell\\open\\command`;
        const output = execSync(`reg query "${regPath}" /ve`, { encoding: 'utf8' });
        const match = output.match(/\s+REG_SZ\s+(.*)/);
        if (match) {
            let command = match[1].trim();
            let exePath = '';
            if (command.startsWith('"')) {
                const endQuoteIndex = command.indexOf('"', 1);
                if (endQuoteIndex !== -1) exePath = command.substring(1, endQuoteIndex);
            } else {
                exePath = command.split(' ')[0];
            }
            if (exePath && fs.existsSync(exePath)) return exePath;
        }
    } catch (e) {
        console.error(`查询协议 ${protocol} 失败:`, e.message);
    }
    return null;
}

/**
 * 获取系统音量 (PowerShell)
 */
async function getSystemVolume() {
    return new Promise((resolve) => {
        const script = `
      $code = @'
      using System;
      using System.Runtime.InteropServices;
      [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
      public interface IAudioEndpointVolume {
          int SetMasterVolumeLevelScalar(float fLevel, ref Guid pguidEventContext);
          int GetMasterVolumeLevelScalar(out float pfLevel);
      }
      [Guid("D6660639-824D-4AC8-B9CD-491F02F16260"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
      public interface IMMDevice {
          int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
      }
      [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
      public interface IMMDeviceEnumerator {
          int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
      }
      [Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] public class MMDeviceEnumerator { }
      public class AudioHelper {
          public static float GetVolume() {
              IMMDeviceEnumerator enumerator = (IMMDeviceEnumerator)new MMDeviceEnumerator();
              IMMDevice device;
              enumerator.GetDefaultAudioEndpoint(0, 0, out device);
              object interfaceObj;
              Guid iid = new Guid("5CDF2C82-841E-4546-9722-0CF74078229A");
              device.Activate(ref iid, 7, IntPtr.Zero, out interfaceObj);
              IAudioEndpointVolume vol = (IAudioEndpointVolume)interfaceObj;
              float v;
              vol.GetMasterVolumeLevelScalar(out v);
              return v;
          }
      }
'@
      Add-Type -TypeDefinition $code
      [Math]::Round([AudioHelper]::GetVolume() * 100)
    `;
        const ps = spawn('powershell.exe', ['-NoProfile', '-Command', script]);
        let output = '';
        ps.stdout.on('data', (data) => { output += data.toString(); });
        ps.on('close', () => resolve(parseInt(output.trim()) || 0));
        ps.on('error', () => resolve(0));
        setTimeout(() => { if (!ps.killed) ps.kill(); resolve(0); }, 3000);
    });
}

/**
 * 设置系统音量 (PowerShell)
 */
function setSystemVolume(value) {
    const volume = value / 100;
    const script = `
    $code = @'
    using System;
    using System.Runtime.InteropServices;
    [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioEndpointVolume {
        int SetMasterVolumeLevelScalar(float fLevel, ref Guid pguidEventContext);
        int GetMasterVolumeLevelScalar(out float pfLevel);
    }
    [Guid("D6660639-824D-4AC8-B9CD-491F02F16260"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDevice {
        int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
    }
    [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDeviceEnumerator {
        int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
    }
    [Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] public class MMDeviceEnumerator { }
    public class AudioHelper {
        public static void SetVolume(float level) {
            IMMDeviceEnumerator enumerator = (IMMDeviceEnumerator)new MMDeviceEnumerator();
            IMMDevice device;
            enumerator.GetDefaultAudioEndpoint(0, 0, out device);
            object interfaceObj;
            Guid iid = new Guid("5CDF2C82-841E-4546-9722-0CF74078229A");
            device.Activate(ref iid, 7, IntPtr.Zero, out interfaceObj);
            IAudioEndpointVolume vol = (IAudioEndpointVolume)interfaceObj;
            Guid g = Guid.Empty;
            vol.SetMasterVolumeLevelScalar(level, ref g);
        }
    }
'@
    Add-Type -TypeDefinition $code
    [AudioHelper]::SetVolume(${volume})
  `;
    spawn('powershell.exe', ['-NoProfile', '-Command', script]);
}

module.exports = {
    getExePathFromProtocol,
    getSystemVolume,
    setSystemVolume
};
