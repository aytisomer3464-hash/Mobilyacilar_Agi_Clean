from tunel import main as tunel_main, paylasim_adresini_yaz


def test_tunel_cloudflared_yok(monkeypatch):
    import tunel

    monkeypatch.setattr(tunel, "cloudflared_yolu", lambda: None)
    assert tunel_main() == 1


def test_paylasim_adresi_yazilir(monkeypatch, capsys):
    monkeypatch.setenv("OCR_PUBLIC_URL", "https://atolye.ornek.com/")
    paylasim_adresini_yaz()
    cikis = capsys.readouterr().out
    assert "Dışarıdan paylaş: https://atolye.ornek.com" in cikis
    assert "trycloudflare" not in cikis


def test_paylasim_adresi_bos(monkeypatch, capsys):
    monkeypatch.delenv("OCR_PUBLIC_URL", raising=False)
    paylasim_adresini_yaz()
    assert "OCR_PUBLIC_URL" in capsys.readouterr().out


def test_tunel_token_ile_adres_basar(monkeypatch, capsys):
    import tunel

    monkeypatch.setattr(tunel, "cloudflared_yolu", lambda: "cloudflared")
    monkeypatch.setattr(tunel, "ortam_yukle", lambda: None)
    monkeypatch.setattr(tunel, "load_dotenv", lambda *_a, **_k: None)
    monkeypatch.setenv("CLOUDFLARE_TUNNEL_TOKEN", "test-token")
    monkeypatch.setenv("OCR_PUBLIC_URL", "https://atolye.ornek.com")
    monkeypatch.setattr(tunel.subprocess, "call", lambda *_a, **_k: 0)
    assert tunel_main() == 0
    cikis = capsys.readouterr().out
    assert "Dışarıdan paylaş: https://atolye.ornek.com" in cikis
    assert "trycloudflare" not in cikis
