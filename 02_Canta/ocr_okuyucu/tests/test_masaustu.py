from masaustu import _port_acik, sunucu_hazir_olana_kadar


class _SahteSunucu:
    def __init__(self, started=False):
        self.started = started


def test_sunucu_hazir_started():
    assert sunucu_hazir_olana_kadar(_SahteSunucu(True), port=1, zaman_asimi=0.2, adim=0.05) is True


def test_sunucu_hazir_zaman_asimi(monkeypatch):
    monkeypatch.setattr("masaustu._port_acik", lambda *_a, **_k: False)
    assert sunucu_hazir_olana_kadar(_SahteSunucu(False), port=1, zaman_asimi=0.15, adim=0.05) is False


def test_port_acik_kapali_port():
    assert _port_acik(1) is False
