export function sessionEnv(platform: 'wayland' | 'x11'): Record<string, string> {
    return {
        GDK_BACKEND: platform, // Overrides an inherited GDK_BACKEND that would send GTK to the other platform.
        XDG_SESSION_TYPE: platform, // Chrome & Edge 140+ (Chrome for Testing 135+) and Electron 38+ choose their platform from this.
        ELECTRON_OZONE_PLATFORM_HINT: platform, // Electron 28-37 reads this instead.
    }
}
