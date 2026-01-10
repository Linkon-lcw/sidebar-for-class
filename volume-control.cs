using System;
using System.Runtime.InteropServices;

namespace VolumeControl {
    [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioEndpointVolume {
        int RegisterControlChangeNotify(IntPtr pNotify);
        int UnregisterControlChangeNotify(IntPtr pNotify);
        int GetChannelCount(out int pnChannelCount);
        int SetMasterVolumeLevel(float fLevelDB, ref Guid pguidEventContext);
        int SetMasterVolumeLevelScalar(float fLevel, ref Guid pguidEventContext);
        int GetMasterVolumeLevel(out float pfLevelDB);
        int GetMasterVolumeLevelScalar(out float pfLevel);
    }

    [Guid("D6660639-824D-4AC8-B9CD-491F02F16260"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDevice {
        int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
        int OpenPropertyStore(int stgmAccess, out object ppProperties);
        int GetId([MarshalAs(UnmanagedType.LPWStr)] out string ppstrId);
        int GetState(out int pdwState);
    }

    [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDeviceEnumerator {
        int EnumAudioEndpoints(int dataFlow, int dwStateMask, out object ppDevices);
        int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
    }

    [ComImport]
    [Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
    public class MMDeviceEnumerator { }

    class Program {
        static void Main(string[] args) {
            try {
                if (args.Length == 0) {
                    // Get Volume
                    float vol = GetVolume();
                    Console.WriteLine(Math.Round(vol * 100));
                } else if (args.Length == 1) {
                    // Set Volume
                    float newVol;
                    if (float.TryParse(args[0], out newVol)) {
                        SetVolume(newVol / 100.0f);
                        Console.WriteLine("OK");
                    }
                }
            } catch (Exception e) {
                Console.WriteLine("Error: " + e.Message);
            }
        }

        static float GetVolume() {
            MMDeviceEnumerator enumerator = new MMDeviceEnumerator();
            IMMDeviceEnumerator deviceEnumerator = (IMMDeviceEnumerator)enumerator;
            IMMDevice device;
            deviceEnumerator.GetDefaultAudioEndpoint(0, 0, out device);

            object interfaceObj;
            Guid iid = typeof(IAudioEndpointVolume).GUID;
            device.Activate(ref iid, 1, IntPtr.Zero, out interfaceObj);

            IAudioEndpointVolume vol = (IAudioEndpointVolume)interfaceObj;
            float v;
            vol.GetMasterVolumeLevelScalar(out v);
            return v;
        }

        static void SetVolume(float level) {
            MMDeviceEnumerator enumerator = new MMDeviceEnumerator();
            IMMDeviceEnumerator deviceEnumerator = (IMMDeviceEnumerator)enumerator;
            IMMDevice device;
            deviceEnumerator.GetDefaultAudioEndpoint(0, 0, out device);

            object interfaceObj;
            Guid iid = typeof(IAudioEndpointVolume).GUID;
            device.Activate(ref iid, 1, IntPtr.Zero, out interfaceObj);

            IAudioEndpointVolume vol = (IAudioEndpointVolume)interfaceObj;
            Guid g = Guid.Empty;
            vol.SetMasterVolumeLevelScalar(level, ref g);
        }
    }
}
