!addincludedir .
!include GAPInfo.nsh
!include MUI2.nsh

!insertmacro GAP_INIT
Unicode true
InstallDir $LOCALAPPDATA\Programs\GreenAcidPipe
ShowInstDetails show
ShowUninstDetails show
SetCompressor /SOLID lzma
RequestExecutionLevel user

!define MUI_ICON icon.ico
!define MUI_UNICON icon.ico

!insertmacro MUI_PAGE_WELCOME
!define MUI_LICENSEPAGE_CHECKBOX
!define MUI_LICENSEPAGE_TEXT_TOP "This license applies to GreenAcidPipe."
!insertmacro MUI_PAGE_LICENSE ${GAP_LICENSEDATA}
!define MUI_LICENSEPAGE_CHECKBOX
!define MUI_LICENSEPAGE_TEXT_TOP "This license applies to ConEmu."
!insertmacro MUI_PAGE_LICENSE conemu\ConEmu\License.txt
!define MUI_LICENSEPAGE_CHECKBOX
!define MUI_LICENSEPAGE_TEXT_TOP "This license applies to Node.js."
!insertmacro MUI_PAGE_LICENSE node\node-v18.18.2-win-x86\LICENSE
!define MUI_LICENSEPAGE_CHECKBOX
!define MUI_LICENSEPAGE_TEXT_TOP "These licenses apply to GreenAcidPipe's dependencies."
!insertmacro MUI_PAGE_LICENSE ..\licenses.txt
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

Section "Node.js"
	SetOutPath $INSTDIR\NodeJS
	File /r node\node-v18.18.2-win-x86\*
SectionEnd

Section
	SetOutPath $INSTDIR\node_modules
	File /r node_modules\*
	SetOutPath $INSTDIR
	File /oname=index.mjs ..\src\index.js
	File ..\package.json
	File appid.json
	File icon.ico
	WriteUninstaller $INSTDIR\Uninstall.exe
	CreateShortcut $DESKTOP\GreenAcidPipe.lnk $INSTDIR\ConEmu\ConEmu.exe "-NoMulti -Single -Run $\"$INSTDIR\NodeJS\node.exe$\" $\"$INSTDIR\index.mjs$\"" $INSTDIR\icon.ico
	CreateShortcut $SMPROGRAMS\GreenAcidPipe.lnk $INSTDIR\ConEmu\ConEmu.exe "-NoMulti -Single -Run $\"$INSTDIR\NodeJS\node.exe$\" $\"$INSTDIR\index.mjs$\"" $INSTDIR\icon.ico

	WriteRegStr   HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${GAP_NAME}" "DisplayName"     "${GAP_NAME}"
	WriteRegStr   HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${GAP_NAME}" "DisplayIcon"     "$\"$INSTDIR\icon.ico$\""
	WriteRegStr   HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${GAP_NAME}" "UninstallString" "$\"$INSTDIR\Uninstall.exe$\""
	WriteRegStr   HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${GAP_NAME}" "InstallLocation" "$INSTDIR"
	WriteRegStr   HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${GAP_NAME}" "RegOwner"        "romw314"
	WriteRegStr   HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${GAP_NAME}" "Publisher"       "romw314"
	WriteRegStr   HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${GAP_NAME}" "URLInfoAbout"    "https://greenacidpipe.vercel.app"
	WriteRegStr   HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${GAP_NAME}" "DisplayVersion"  "${GAP_VERSION}"
	WriteRegStr   HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${GAP_NAME}" "VersionMajor"    "${GAP_VERSION_MAJOR}"
	WriteRegStr   HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${GAP_NAME}" "VersionMinor"    "${GAP_VERSION_MINOR}"
	WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${GAP_NAME}" "NoModify"        1
	WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${GAP_NAME}" "NoRepair"        1
SectionEnd

Section "ConEmu"
	SetOutPath $INSTDIR\ConEmu
	File /r conemu\*
	File ConEmu.xml
SectionEnd

Section "un.Node.js"
	RMDir /r /rebootok $INSTDIR\NodeJS
SectionEnd

Section "un.ConEmu"
	RMDir /r /rebootok $INSTDIR\ConEmu
SectionEnd

Section "Uninstall"
	RMDir /r /rebootok $INSTDIR\node_modules
	Delete /rebootok $INSTDIR\index.mjs
	Delete /rebootok $INSTDIR\icon.ico
	Delete /rebootok $INSTDIR\Uninstall.exe
	Delete /rebootok $DESKTOP\GreenAcidPipe.lnk
	Delete /rebootok $SMPROGRAMS\GreenAcidPipe.lnk
	RMDir /rebootok $INSTDIR
	DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${GAP_NAME}"
SectionEnd
