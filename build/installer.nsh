; Custom NSIS Uninstall Script
; Ensure complete cleanup of installation

!macro customUnInstall
  ; Force kill the process if running
  nsExec::ExecToLog 'taskkill /F /IM "QR Scanner.exe" /T'
  Sleep 1000

  ; Delete shortcuts
  Delete "$DESKTOP\QR Scanner.lnk"
  Delete "$SMPROGRAMS\QR Scanner\QR Scanner.lnk"
  Delete "$SMPROGRAMS\QR Scanner\Uninstall QR Scanner.lnk"
  RMDir "$SMPROGRAMS\QR Scanner"

  ; Delete auto-start registry
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "QR Scanner"

  ; Clean registry
  DeleteRegKey HKCU "Software\QR Scanner"
  DeleteRegKey HKLM "Software\QR Scanner"

  ; Delete user data (AppData)
  RMDir /r "$APPDATA\qr-scanner"
  RMDir /r "$LOCALAPPDATA\qr-scanner"

  ; Delete all installation files
  RMDir /r "$INSTDIR\locales"
  RMDir /r "$INSTDIR\resources"
  RMDir /r "$INSTDIR\src"
  RMDir /r "$INSTDIR\assets"
  Delete "$INSTDIR\*.dll"
  Delete "$INSTDIR\*.exe"
  Delete "$INSTDIR\*.pak"
  Delete "$INSTDIR\*.dat"
  Delete "$INSTDIR\*.bin"
  Delete "$INSTDIR\LICENSE*"
  Delete "$INSTDIR\version"
  Delete "$INSTDIR\*.js"
  Delete "$INSTDIR\package.json"

  ; Delete installation directory
  SetOutPath "$TEMP"
  RMDir "$INSTDIR"
!macroend
