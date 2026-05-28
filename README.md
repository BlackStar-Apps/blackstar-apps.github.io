# BlackStar Apps Website

Statische Website fuer `blackstar-apps.de`.

## Lokale Vorschau

Die Website kann direkt ueber `index.html` geoeffnet werden. Fuer eine lokale Server-Vorschau:

```powershell
python -m http.server 8080
```

Danach im Browser oeffnen:

```text
http://localhost:8080
```

## Vor der Veroeffentlichung

- Google-Play-Link pruefen.
- GitHub Pages aktivieren.
- Bei IONOS die Domain `blackstar-apps.de` auf GitHub Pages zeigen lassen.

## Dateien

- `index.html` - Startseite
- `qr-code-erstellen.html` - kostenloser lokaler QR-Code-Generator
- `datenschutz.html` - Datenschutzerklaerung
- `impressum.html` - Anbieterkennzeichnung
- `app-ads.txt` - AdMob-Verifizierung
- `CNAME` - Custom Domain fuer GitHub Pages

Der Web-Generator verwendet die lokal gebuendelte MIT-lizenzierte Bibliothek
`qrcode-generator` von Kazuhiko Arase.
