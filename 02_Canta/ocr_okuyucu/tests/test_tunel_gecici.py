import io

from tunel_gecici import ciktiyi_isle, trycloudflare_adresi, tunel_komutu


def test_trycloudflare_adresi_ayiklar():
    satir = "INF |  https://abc-kelime.trycloudflare.com"
    assert trycloudflare_adresi(satir) == "https://abc-kelime.trycloudflare.com"


def test_trycloudflare_adresi_yok():
    assert trycloudflare_adresi("INF Starting tunnel") is None


def test_ciktiyi_isle_bir_kez_yazar(capsys):
    bulunan: list[str] = []
    adres = "https://abc-kelime.trycloudflare.com"
    assert ciktiyi_isle(f"Visit {adres}", bulunan) == adres
    assert ciktiyi_isle(f"Visit {adres}", bulunan) is None
    cikis = capsys.readouterr().out
    assert cikis.count("Dışarıdan paylaş: https://abc-kelime.trycloudflare.com") == 1
    assert "Okuyucu: https://abc-kelime.trycloudflare.com/okuyucu" in cikis


def test_tunel_komutu_token_yok():
    cmd = tunel_komutu("cloudflared", "8765")
    assert cmd == ["cloudflared", "tunnel", "--no-autoupdate", "--url", "http://127.0.0.1:8765"]
    assert "--token" not in cmd
    assert "CLOUDFLARE_TUNNEL_TOKEN" not in cmd


def test_gecici_cloudflared_yok(monkeypatch):
    import tunel_gecici

    monkeypatch.setattr(tunel_gecici, "cloudflared_yolu", lambda: None)
    monkeypatch.setattr(tunel_gecici, "ortam_yukle", lambda: None)
    monkeypatch.setattr(tunel_gecici, "load_dotenv", lambda *_a, **_k: None)
    assert tunel_gecici.main() == 1


def test_gecici_surec_link_basar(monkeypatch, capsys):
    import tunel_gecici

    class Sahte:
        stdout = io.StringIO("INF https://xyz-tunel.trycloudflare.com\n")

        def wait(self):
            return 0

        def terminate(self):
            return None

    monkeypatch.setattr(tunel_gecici, "cloudflared_yolu", lambda: "cloudflared")
    monkeypatch.setattr(tunel_gecici, "ortam_yukle", lambda: None)
    monkeypatch.setattr(tunel_gecici, "load_dotenv", lambda *_a, **_k: None)
    monkeypatch.setattr(
        tunel_gecici.subprocess,
        "Popen",
        lambda *a, **k: Sahte(),
    )
    assert tunel_gecici.main() == 0
    cikis = capsys.readouterr().out
    assert "Dışarıdan paylaş: https://xyz-tunel.trycloudflare.com" in cikis
    assert "--token" not in cikis
