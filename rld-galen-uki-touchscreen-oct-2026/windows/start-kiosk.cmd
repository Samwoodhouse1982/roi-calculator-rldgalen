@echo off
rem ----------------------------------------------------------------------
rem  RLDatix Galen UKI touchscreen - kiosk launcher for Windows
rem  Opens the calculator full screen in Microsoft Edge kiosk mode on the
rem  main display. See SETUP-WINDOWS.md in this folder before first use.
rem ----------------------------------------------------------------------

rem  1. Set this to the touchscreen's live address (the Netlify or Vercel URL).
set "KIOSK_URL=https://REPLACE-WITH-THE-UKI-TOUCHSCREEN-URL"

rem  2. Close any Edge windows using the kiosk profile, then launch.
rem     --kiosk ... --edge-kiosk-type=fullscreen : full screen, no browser UI
rem     --disable-pinch                          : no pinch-to-zoom
rem     --overscroll-history-navigation=0        : no swipe-to-go-back
rem     --user-data-dir                          : separate profile, so the
rem       kiosk never restores tabs or sign-ins from normal Edge use
start "" msedge --kiosk "%KIOSK_URL%" --edge-kiosk-type=fullscreen --no-first-run --disable-pinch --overscroll-history-navigation=0 --user-data-dir="%LOCALAPPDATA%\GalenKioskProfile"
