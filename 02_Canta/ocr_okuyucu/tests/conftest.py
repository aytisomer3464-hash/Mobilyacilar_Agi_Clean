import sys
from pathlib import Path

import pytest

KOK = Path(__file__).resolve().parents[1]
if str(KOK) not in sys.path:
    sys.path.insert(0, str(KOK))


@pytest.fixture(autouse=True)
def gecici_veri_kok(tmp_path, monkeypatch):
    """Testlerin gerçek arşive yazmaması için veri kökünü geçici klasöre alır."""
    monkeypatch.setenv("OCR_ARSIV_IZLE", "0")
    monkeypatch.setenv("OCR_GECMIS_GOC", "0")
    monkeypatch.delenv("OCR_API_TOKEN", raising=False)
    monkeypatch.delenv("MAGI_VITRIN_SIFRE", raising=False)
    import arsiv
    import hata_kayit
    import ogrenme_kurallari

    kok = tmp_path / "veri"
    kok.mkdir(parents=True, exist_ok=True)
    monkeypatch.setattr(ogrenme_kurallari, "veri_kok", lambda: kok)
    monkeypatch.setattr(arsiv, "veri_kok", lambda: kok)
    monkeypatch.setattr(hata_kayit, "veri_kok", lambda: kok)
    yield kok
