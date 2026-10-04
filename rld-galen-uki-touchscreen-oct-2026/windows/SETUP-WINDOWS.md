# Running the UKI touchscreen on a UPERFECT 24.5" 2K screen from a Windows laptop

The calculator is designed for a 1080×1920 portrait screen. The UPERFECT
24.5" 2K panel is 2560×1440, so it **must be used in portrait** (1440×2560).
That is exactly the same shape as the design, and the calculator scales
itself to fill the screen at any Windows display-scaling setting. In
landscape it still works, but as a narrow column with dark bars each side.

## 1. Mount and connect

- Mount the screen in portrait with a VESA 75×75 stand or arm. The built-in
  folding stand is for landscape.
- **Video and touch:** connect the laptop to the screen's USB-C port with a
  USB-C to USB-C cable. One cable carries both picture and touch. The
  laptop's USB-C port must support video (DisplayPort Alt Mode or
  Thunderbolt; check for a DP or lightning symbol).
  - If the laptop has no video-capable USB-C port, use mini-HDMI to HDMI
    for the picture **and** a USB-C cable to the laptop for touch. HDMI
    alone gives a picture but no touch.
- **Power:** plug the included power adapter into the screen's other USB-C
  port. Don't rely on the laptop to power a 24.5" screen.

## 2. Windows display settings

Settings → System → Display:

1. Select the UPERFECT screen (use **Identify** if unsure).
2. **Display orientation: Portrait.** Pick "Portrait (flipped)" instead if
   the picture is upside down for how it's mounted.
3. **Make this my main display** (or, with the laptop lid closed, use
   Win+P → **Second screen only**). The launcher opens on the main display.
4. Scale: any value works; the recommended one is fine.

## 3. Map touch to the right screen

With a laptop plus a second screen, Windows sometimes sends touches to the
wrong one (you tap the UPERFECT and the laptop screen reacts).

Control Panel → Hardware and Sound → **Tablet PC Settings** → **Setup…** →
**Touch input**, then tap the UPERFECT screen when asked. Re-check after
changing orientation.

## 4. Stop the laptop interrupting the kiosk

- Settings → System → Power: screen and sleep **Never** when plugged in.
- Settings → System → Notifications: turn on **Do not disturb**.
- Settings → Windows Update: set **Active hours** to cover the event, or
  pause updates for the event days.
- Keep the laptop on mains power.

## 5. Launch

1. `start-kiosk.cmd` already points at the live touchscreen,
   https://galen-uki-touchscreen.netlify.app/. If the address ever changes,
   open it in Notepad and update the `KIOSK_URL` value.
   - The touchscreen starts in the NHS sector. For an event aimed at
     private providers or Ireland, open `start-kiosk.cmd` in Notepad and
     set `SECTOR` to `uk-private`, `hse` or `ie-private`. Every new visitor
     then starts in that sector, and can still switch on the first step.
2. Double-click `start-kiosk.cmd`. Edge opens the calculator full screen
   with pinch-zoom and swipe-back turned off.
3. To start it automatically when the laptop signs in: Win+R →
   `shell:startup` → put a shortcut to `start-kiosk.cmd` in that folder.
4. To exit kiosk mode: Alt+F4 on a keyboard.

## 6. Network

The calculator loads from the internet (Netlify), and its font comes from
Google Fonts. Once loaded it keeps working if the connection drops, but:

- If the laptop restarts, or the calculator reloads itself after an error,
  it needs a connection to come back.
- Without a connection to Google Fonts it falls back to the system font.
  It still works; it just looks slightly different.

At venues with unreliable Wi-Fi, use a phone hotspot or wired connection.

## 7. Before the event

- Tap through the whole flow once: splash, all five steps, results, an "i"
  tooltip, "Enter your own system" (on-screen keyboard), and "New case".
- Tap the RLDatix logo on the splash to see the stats screen. The reset PIN
  is in the app source (`ADMIN_PIN` in `kiosk-app/src/App.jsx`).
