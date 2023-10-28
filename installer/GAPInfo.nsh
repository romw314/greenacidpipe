
!define GAP_VERSION 0.0.1
!define PRODUCT_VERSION 0.0.1
!define VERSION 0.0.1.0
!define GAP_NAME GreenAcidPipe
!define NAME GreenAcidPipe
!define GAP_LICENSEDATA "C:\Users\romanko\source\js\greenacidpipe\license.txt"
!define GAP_VERSION_MINOR 0
!define GAP_VERSION_MAJOR 0

!macro GAP_INIT
	OutFile "..\dist\GreenAcidPipe v0.0.1 Setup.exe"
	VIProductVersion "${PRODUCT_VERSION}"
	VIFileVersion "${VERSION}"
	Name "${NAME}"
!macroend
