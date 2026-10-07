"""Ham kroki fotoğrafları ve JSON çıktılarını kalıcı arşive yazar. Silme yok."""

from __future__ import annotations

import hashlib
import json
import os
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ogrenme_kurallari import veri_kok

ARSIV_ALT = "arsiv"
KAYITLAR_ALT = "kayitlar"


def arsiv_kok() -> Path:
    yol = veri_kok() / ARSIV_ALT / KAYITLAR_ALT
    yol.mkdir(parents=True, exist_ok=True)
    return yol


def kayit_klasoru(kayit_id: str) -> Path:
    return arsiv_kok() / kayit_id


@contextmanager
def _dosya_kilidi(kilit_yolu: Path):
    kilit_yolu.parent.mkdir(parents=True, exist_ok=True)
    tutamak = open(kilit_yolu, "a+b")
    try:
        tutamak.seek(0, os.SEEK_END)
        if tutamak.tell() == 0:
            tutamak.write(b"0")
            tutamak.flush()
        tutamak.seek(0)
        if os.name == "nt":
            import msvcrt
            msvcrt.locking(tutamak.fileno(), msvcrt.LK_LOCK, 1)
        else:
            import fcntl
            fcntl.flock(tutamak.fileno(), fcntl.LOCK_EX)
        yield
    finally:
        try:
            if os.name == "nt":
                import msvcrt
                tutamak.seek(0)
                msvcrt.locking(tutamak.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                import fcntl
                fcntl.flock(tutamak.fileno(), fcntl.LOCK_UN)
        finally:
            tutamak.close()


def _json_yaz(yol: Path, veri: Any) -> None:
    yol.parent.mkdir(parents=True, exist_ok=True)
    gecici = yol.with_suffix(yol.suffix + ".tmp")
    gecici.write_text(json.dumps(veri, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(gecici, yol)


def _uzanti(dosya_adi: str | None, veri: bytes) -> str:
    ad = (dosya_adi or "").lower()
    if ad.endswith(".png"):
        return ".png"
    if ad.endswith(".webp"):
        return ".webp"
    if ad.endswith((".tif", ".tiff")):
        return ".tiff"
    if veri[:8] == b"\x89PNG\r\n\x1a\n":
        return ".png"
    return ".jpg"


def benzersiz_kroki_adi(uzanti: str) -> str:
    uzanti = uzanti if uzanti.startswith(".") else f".{uzanti}"
    damga = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
    return f"kroki_{damga}_{uuid.uuid4().hex[:8]}{uzanti.lower()}"


def bayt_hash(veri: bytes) -> str:
    return hashlib.sha256(veri).hexdigest()


def dosya_hash(yol: Path) -> str:
    return bayt_hash(yol.read_bytes())


def piksel_imza(yol: Path | None = None, veri: bytes | None = None) -> str | None:
    """Açılabilen görselin piksel içeriğinin SHA256'sı; bozuksa None."""
    from io import BytesIO
    from PIL import Image

    try:
        kaynak = BytesIO(veri) if veri is not None else yol
        if kaynak is None:
            return None
        with Image.open(kaynak) as img:
            img.load()
            rgb = img.convert("RGB")
            return hashlib.sha256(rgb.tobytes()).hexdigest()
    except Exception:
        return None


def gorsel_bozuk_mu(yol: Path) -> bool:
    return piksel_imza(yol=yol) is None


def hash_indeks_yolu() -> Path:
    yol = veri_kok() / ARSIV_ALT
    yol.mkdir(parents=True, exist_ok=True)
    return yol / "hash_indeks.json"


def hash_indeksi_oku() -> dict[str, Any]:
    yol = hash_indeks_yolu()
    if not yol.exists():
        return {"sha256": {}, "piksel": {}}
    try:
        veri = json.loads(yol.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {"sha256": {}, "piksel": {}}
    if not isinstance(veri, dict):
        return {"sha256": {}, "piksel": {}}
    veri.setdefault("sha256", {})
    veri.setdefault("piksel", {})
    return veri


def hash_indeksi_yaz(indeks: dict[str, Any]) -> None:
    _json_yaz(hash_indeks_yolu(), indeks)


def icerik_zaten_var(sha: str, piksel: str | None) -> str | None:
    """Aynı bayt veya aynı pikseller arşivdeyse mevcut kayit_id döner."""
    indeks = hash_indeksi_oku()
    for anahtar, kova in (("sha256", sha), ("piksel", piksel)):
        if not kova:
            continue
        kayit = (indeks.get(anahtar) or {}).get(kova)
        if isinstance(kayit, dict):
            kid = str(kayit.get("kayit_id") or "")
            if kid:
                return kid
    return None


def indekse_ekle(kayit_id: str, yol: Path, sha: str, piksel: str | None) -> None:
    indeks = hash_indeksi_oku()
    kayit = {"kayit_id": kayit_id, "yol": str(yol)}
    indeks["sha256"][sha] = kayit
    if piksel:
        indeks["piksel"][piksel] = kayit
    hash_indeksi_yaz(indeks)


def cakismayan_hedef(klasor: Path, dosya_adi: str, yeni_hash: str) -> Path:
    """Aynı isim, farklı içerik: ezme; yeni bağımsız ad üret."""
    hedef = klasor / dosya_adi
    if not hedef.exists():
        return hedef
    try:
        eski = dosya_hash(hedef)
    except OSError:
        return hedef
    if eski == yeni_hash:
        return hedef
    kok = hedef.stem
    uzanti = hedef.suffix
    sira = 2
    while True:
        aday = klasor / f"{kok}_{sira}{uzanti}"
        if not aday.exists():
            return aday
        sira += 1


def ham_taramayi_arsivle(
    gorsel_baytlari: bytes,
    ham_json: dict[str, Any],
    dosya_adi: str | None = None,
) -> str:
    """Fotoğraf ve ham OCR JSON'unu yeni bir klasöre yazar; kopya içeriği yeniden saklamaz."""
    sha = bayt_hash(gorsel_baytlari)
    piksel = piksel_imza(veri=gorsel_baytlari)
    mevcut = icerik_zaten_var(sha, piksel)
    if mevcut and kayit_klasoru(mevcut).exists():
        klasor = kayit_klasoru(mevcut)
        if not (klasor / "ham.json").exists():
            _json_yaz(klasor / "ham.json", ham_json)
        return mevcut

    kayit_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S") + "_" + uuid.uuid4().hex[:10]
    klasor = kayit_klasoru(kayit_id)
    klasor.mkdir(parents=True, exist_ok=True)
    uzanti = _uzanti(dosya_adi, gorsel_baytlari)
    kroki_yol = klasor / benzersiz_kroki_adi(uzanti)
    kroki_yol.write_bytes(gorsel_baytlari)
    _json_yaz(klasor / "ham.json", ham_json)
    _json_yaz(klasor / "meta.json", {
        "kayit_id": kayit_id,
        "olusturma": datetime.now(timezone.utc).isoformat(),
        "orijinal_dosya": dosya_adi or "",
        "kroki_adi": kroki_yol.name,
        "sha256": sha,
        "piksel": piksel,
        "duzeltme_var": False,
        "ogrenmeye_dahil": False,
        "silinemez": True,
        "kaynak": "sistem",
    })
    indekse_ekle(kayit_id, kroki_yol, sha, piksel)
    return kayit_id


def duzeltmeyi_arsivle(kayit_id: str, duzeltilmis_json: dict[str, Any]) -> Path:
    klasor = kayit_klasoru(kayit_id)
    if not klasor.exists():
        raise FileNotFoundError(f"Arşiv kaydı yok: {kayit_id}")
    _json_yaz(klasor / "duzeltilmis.json", duzeltilmis_json)
    meta_yol = klasor / "meta.json"
    meta = {}
    if meta_yol.exists():
        try:
            meta = json.loads(meta_yol.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            meta = {}
    meta.update({
        "kayit_id": kayit_id,
        "duzeltme_var": True,
        "duzeltme_zamani": datetime.now(timezone.utc).isoformat(),
        "silinemez": True,
    })
    _json_yaz(meta_yol, meta)
    return klasor


def meta_guncelle(kayit_id: str, **alanlar: Any) -> None:
    yol = kayit_klasoru(kayit_id) / "meta.json"
    meta = {}
    if yol.exists():
        try:
            meta = json.loads(yol.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            meta = {}
    meta.update(alanlar)
    meta["silinemez"] = True
    _json_yaz(yol, meta)


def islenmemis_duzeltmeler() -> list[Path]:
    sonuc = []
    kok = arsiv_kok()
    if not kok.exists():
        return sonuc
    for klasor in sorted(kok.iterdir()):
        if not klasor.is_dir():
            continue
        if not (klasor / "duzeltilmis.json").exists():
            continue
        meta = {}
        meta_yol = klasor / "meta.json"
        if meta_yol.exists():
            try:
                meta = json.loads(meta_yol.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                meta = {}
        if meta.get("ogrenmeye_dahil") is True:
            continue
        sonuc.append(klasor)
    return sonuc


def json_oku(yol: Path) -> dict[str, Any] | None:
    try:
        veri = json.loads(yol.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return veri if isinstance(veri, dict) else None


def arsiv_izlemeyi_baslat(*args, **kwargs):
    from arsiv_yonetim import arsiv_izlemeyi_baslat as _fn
    return _fn(*args, **kwargs)


def harici_arsivi_isle(*args, **kwargs):
    from arsiv_yonetim import harici_arsivi_isle as _fn
    return _fn(*args, **kwargs)


def son_arsiv_ozeti() -> dict[str, Any]:
    from arsiv_yonetim import son_arsiv_ozeti as _fn
    return _fn()
