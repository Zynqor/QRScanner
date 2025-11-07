; 自定义 NSIS 卸载脚本
; 确保完全清理安装痕迹

!macro customUnInstall
  ; 关闭正在运行的程序
  ${IfNot} ${Silent}
    MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION "即将卸载 QR Scanner。$\n$\n如果程序正在运行，请先退出程序，然后点击"确定"继续卸载。" IDOK proceed IDCANCEL cancel
    cancel:
      Abort "卸载已取消"
    proceed:
  ${EndIf}

  ; 强制结束进程（如果还在运行）
  nsExec::ExecToLog 'taskkill /F /IM "QR Scanner.exe" /T'
  Sleep 1000

  ; 删除快捷方式
  Delete "$DESKTOP\QR Scanner.lnk"
  Delete "$SMPROGRAMS\QR Scanner\QR Scanner.lnk"
  Delete "$SMPROGRAMS\QR Scanner\卸载 QR Scanner.lnk"
  RMDir "$SMPROGRAMS\QR Scanner"

  ; 删除自启动项
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "QR Scanner"

  ; 清理注册表
  DeleteRegKey HKCU "Software\QR Scanner"
  DeleteRegKey HKLM "Software\QR Scanner"

  ; 删除用户数据（AppData）
  RMDir /r "$APPDATA\qr-scanner"
  RMDir /r "$LOCALAPPDATA\qr-scanner"

  ; 删除所有安装文件
  RMDir /r "$INSTDIR\locales"
  RMDir /r "$INSTDIR\resources"
  RMDir /r "$INSTDIR\src"
  Delete "$INSTDIR\*.dll"
  Delete "$INSTDIR\*.exe"
  Delete "$INSTDIR\*.pak"
  Delete "$INSTDIR\*.dat"
  Delete "$INSTDIR\*.bin"
  Delete "$INSTDIR\LICENSE*"
  Delete "$INSTDIR\version"
  Delete "$INSTDIR\chrome_*"
  Delete "$INSTDIR\d3dcompiler_*"
  Delete "$INSTDIR\ffmpeg*"
  Delete "$INSTDIR\icudtl.dat"
  Delete "$INSTDIR\libEGL.dll"
  Delete "$INSTDIR\libGLESv2.dll"
  Delete "$INSTDIR\snapshot_blob.bin"
  Delete "$INSTDIR\v8_context_snapshot.bin"
  Delete "$INSTDIR\vk_swiftshader*.dll"
  Delete "$INSTDIR\vulkan-1.dll"

  ; 最后删除安装目录本身（即使 Uninstall.exe 还在）
  ; 使用延迟删除，在卸载程序退出后删除
  SetOutPath "$TEMP"
  RMDir /r "$INSTDIR"
!macroend

!macro customInstall
  ; 创建卸载程序的注册表项，确保能在控制面板中看到
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "UninstallString" "$INSTDIR\Uninstall ${PRODUCT_NAME}.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "DisplayIcon" "$INSTDIR\${PRODUCT_FILENAME}.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "Publisher" "${COMPANY_NAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "DisplayVersion" "${VERSION}"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "NoRepair" 1
!macroend
