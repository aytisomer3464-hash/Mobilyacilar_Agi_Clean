# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_all

datas = [("web/static", "web/static")]
binaries = []
hiddenimports = ["uvicorn.logging", "uvicorn.protocols.http.auto", "uvicorn.protocols.websockets.auto", "uvicorn.lifespan.on"]

for paket in ("google.genai", "google.auth", "cv2", "rapidocr_onnxruntime", "rapidocr", "fastapi", "uvicorn", "starlette"):
    try:
        toplanan = collect_all(paket)
        datas += toplanan[0]
        binaries += toplanan[1]
        hiddenimports += toplanan[2]
    except Exception:
        pass

a = Analysis(
    ["masaustu.py"],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["pytest"],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="KesimOCR",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
)
