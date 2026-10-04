@echo off
rem ----------------------------------------------------------------------
rem  RLDatix Galen UKI touchscreen - kiosk launcher for Windows
rem  Opens the calculator full screen in Microsoft Edge kiosk mode on the
rem  main display. See SETUP-WINDOWS.md in this folder before first use.
rem ----------------------------------------------------------------------

rem  1. The touchscreen's live address. Only change this if the site moves.
set "KIOSK_URL=https://galen-uki-touchscreen.netlify.app/"

rem  2. The sector the touchscreen starts in, and returns to after each
rem     visitor. Leave it empty for NHS, or set it to uk-private, hse or
rem     ie-private for an event aimed at that audience. Visitors can still
rem     change sector on the first step.
set "SECTOR="
if defined SECTOR set "KIOSK_URL=%KIOSK_URL%?sector=%SECTOR%"

rem  3. Close any Edge windows using the kiosk profile, then launch.
rem     --kiosk ... --edge-kiosk-type=fullscreen : full screen, no browser UI
rem     --disable-pinch                          : no pinch-to-zoom
rem     --overscroll-history-navigation=0        : no swipe-to-go-back
rem     --user-data-dir                          : separate profile, so the
rem       kiosk never restores tabs or sign-ins from normal Edge use
start "" msedge --kiosk "%KIOSK_URL%" --edge-kiosk-type=fullscreen --no-first-run --disable-pinch --overscroll-history-navigation=0 --user-data-dir="%LOCALAPPDATA%\GalenKioskProfile"
