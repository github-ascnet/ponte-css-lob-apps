# Fragekatalog - Authentifizierung und Autorisierung

Webbasierte, responsive Survey-Anwendung zur strukturierten Bewertung von Authentifizierung, Identifikation, Autorisierung und Migrationsrisiken.

## Projektüberblick

Die Anwendung ist als reine Frontend-App umgesetzt:

- HTML5
- CSS3
- Vanilla JavaScript (ohne Build-Prozess)

Sie unterstützt:

- mehrstufige Navigation mit Validierung
- Risikobewertung (Ampel/Severity)
- Zusammenfassung aller Antworten
- JSON-Export
- Druckansicht
- lokale Zwischenspeicherung im Browser (`localStorage`)

## Wichtigster Punkt: Vollständig konfigurierbar über `data/survey-config.json`

Der komplette Fragekatalog wird über **eine zentrale Konfigurationsdatei** gesteuert: [data/survey-config.json](data/survey-config.json)

Das bedeutet:

- Fragen, Bereiche und Reihenfolge sind dort definiert
- Antwortoptionen kommen aus `optionSets`
- Tooltip-Erklärungen kommen aus `optionSets[].description`
- UI-Titel (`appTitle`, `documentTitle`) kommen aus der Konfiguration
- Risk-Mapping (`green/yellow/red/grey`) ist konfigurierbar

Ohne Änderungen am JavaScript lassen sich dadurch neue Fragen, geänderte Texte, angepasste Optionen und Bewertungslogiken pflegen.

## Aufbau der Konfiguration

`data/survey-config.json` enthält u. a.:

- `title` / `ui`: Seitentitel und sichtbarer App-Titel
- `riskMapping`: Labels, Beschreibungen und Severity je Risikostufe
- `optionSets`: wiederverwendbare Auswahlmengen inkl. Beschreibung
- `sections`: Schrittstruktur mit Fragen (`questions`)

Beispiel für ein `optionSet`:

```json
"yesNoUnknown": {
  "description": "Erklärung für den Tooltip...",
  "options": [
    { "value": "yes", "label": "Ja", "risk": "green" },
    { "value": "no", "label": "Nein", "risk": "red" },
    { "value": "unknown", "label": "Unbekannt", "risk": "grey" }
  ]
}
```

## Projektstruktur

- [index.html](index.html): App-Shell
- [styles/styles.css](styles/styles.css): Styles inkl. Responsive/Print
- [js/main.js](js/main.js): Rendering, Navigation, Validierung, Auswertung
- [data/survey-config.json](data/survey-config.json): zentrale Konfiguration
- [images/](images/): Logos/Bilder

## Lokal starten

Da es eine statische Frontend-Anwendung ist, genügt ein lokaler Webserver.

Beispiel mit VS Code Live Server oder einem beliebigen HTTP-Server im Projektverzeichnis.

## Hinweis zur Pflege

Für fachliche Anpassungen zuerst immer `data/survey-config.json` ändern. Code-Anpassungen in `js/main.js` sind nur erforderlich, wenn neue Fragetypen oder neue Rendering-Logik eingeführt werden sollen.

## Ursprünglicher Copilot Prompt

Der folgende Prompt wurde zu Beginn verwendet, um das Basisprojekt zu erstellen:

```text
Erstelle eine vollständige responsive Web App mit HTML, CSS und Vanilla JavaScript für einen Customer Satisfaction Survey basierend auf einem Fragekatalog zu:

«Fragekatalog – Authentifizierung und Autorisierung»

Dateistruktur:
- index.html liegt im Root
- styles.css liegt unter /styles/styles.css
- main.js liegt unter /js/main.js
- survey-config.json liegt unter /data/survey-config.json

Architektur:
- HTML enthält nur die App-Shell (Header, Footer, Content Container)
- CSS enthält ausschliesslich Styling
- JavaScript rendert die gesamte Survey-Logik dynamisch
- Fragen, Kategorien und Antwortoptionen werden vollständig aus der JSON-Datei geladen

JSON-Konfiguration:
Die Datei /data/survey-config.json enthält:
- Kategorien (Sections)
- Fragen
- Antworttypen (Radio, Checkbox, Dropdown, Rating, Ampel)
- Antwortoptionen
- Pflichtfelder
- Icons pro Kategorie
- Risiko-Mapping für die Auswertung

Antwortoptionen in der JSON-Konfiguration:
Betriebsmodell:
- On-Premises
- Cloud / SaaS
- Hybrid
- Unbekannt

Plattform:
- Windows Server
- Linux
- Webplattform
- Datenbanklösung
- Appliance
- Unbekannt

Authentifizierung:
- Windows Authentication / Kerberos
- NTLM
- Benutzername / Passwort
- SAML
- OAuth 2.0
- OpenID Connect
- Entra ID
- ADFS
- Anderer Identity Provider
- Unbekannt

Benutzeridentifikation:
- UPN
- E-Mail-Adresse
- sAMAccountName
- ObjectGUID / ImmutableId
- Interne Benutzer-ID
- Unbekannt

Autorisierung:
- AD-Gruppen direkt
- Internes Rollenmodell
- Importierte Benutzer/Rollen
- Manuelle Berechtigungsvergabe
- Mischform
- Unbekannt

Cross-Forest-Fähigkeit:
- Unterstützt
- Unterstützt mit Einschränkungen
- Nicht unterstützt
- Nicht getestet
- Hersteller muss bestätigen

Identity Provider:
- Active Directory
- Entra ID
- ADFS
- Drittanbieter IAM
- Kein zentrales System
- Unbekannt

Gruppenunterstützung:
- Verschachtelte Gruppen unterstützt
- Nur flache Gruppen
- Eingeschränkt
- Nicht unterstützt
- Unbekannt

Einschränkungen:
- Token Size Limitation
- Probleme mit verschachtelten Gruppen
- Abhängigkeit von AD-Attributen
- Probleme mit mehreren Domains oder Forests
- Keine bekannten Einschränkungen
- Unbekannt

Migration:
- Keine Auswirkungen erwartet
- Anpassungen notwendig
- Benutzer müssen neu angelegt werden
- Gruppen müssen neu zugeordnet werden
- Migration bestehender Benutzerzuordnungen möglich
- Herstellerunterstützung erforderlich
- Unbekannt

Ampelbewertung:
- Grün
- Gelb
- Rot
- Unbekannt

Bewertung:
- Kompatibel
- Wahrscheinlich kompatibel
- Unklar
- Anpassungsbedarf erwartet
- Kritisch / nicht kompatibel

Fragetypen:
- Radio Cards für Ja/Nein/Unbekannt
- Dropdowns für Betriebsmodell, Plattform, Identity Provider, Protokolle
- Checkbox-Gruppen für unterstützte Verfahren
- Bewertungsskala 1–5 für Risiko, Kompatibilität und Anpassungsbedarf
- Ampelbewertung: Grün / Gelb / Rot / Unbekannt

Ziel:
- Minimale Nutzung von Freitext
- Einziges Freitextfeld: Name der Applikation
- Alle anderen Felder als strukturierte Auswahl

UI / UX:
- Multi-Step Survey
- Fortschrittsanzeige
- Schrittweise Navigation (Zurück / Weiter)
- Validierung pro Schritt
- Zusammenfassung am Ende
- JSON Export Button («JSON speichern»)
- Druckfreundliche Ansicht

Header:
- Fixierter Header oben
- Links aussen: Logo (Universitätsspital Basel)
- Mittig: Titel «Fragekatalog – Authentifizierung und Autorisierung»
- Optional: Logo auch leicht mittig integriert (visuell ausgewogen)
- Modern, clean, leicht transparent oder mit feinem Schatten
- Höhe nicht zu dominant (Enterprise Look)

Footer:
- Fixierter oder am Ende angehängter Footer
- Drei Bereiche:
  - Links mittig: «©2025 ASCNET Solutions GmbH»
  - Rechts mittig: «Designed by GitHub Copilot»
- Dezentes Styling, kleine Schrift, graue Farbe

Design:
Apple Modern Enterprise Style:
- Viel Weissraum
- Card-basierte UI
- Abgerundete Ecken
- Subtile Schatten
- Hochwertige Typografie
- Ruhige Animationen

Funktionale Anforderungen:
1. Multi-Step Survey mit Fortschrittsanzeige
2. Jede Kategorie soll als eigener Schritt dargestellt werden
3. Navigation: Zurück, Weiter, Zusammenfassung anzeigen
4. Pflichtfelder visuell markieren
5. App-Name als einziges Freitextfeld
6. Alle anderen Fragen als Auswahloptionen
7. Antworten sollen im Browser-State gespeichert werden
8. Am Ende eine Zusammenfassung anzeigen
9. Zusammenfassung soll als JSON exportierbar sein
10. Zusätzlich soll eine druckfreundliche Zusammenfassung erzeugt werden können
11. Validierung pro Schritt
12. Mobile Navigation darf nicht überladen wirken

Farbschema:
Orientiere dich an den Farben des Universitätsspital Basel Logos:
- Weiss / Off-White als Hauptfläche
- Schwarz / Anthrazit für Text
- Rot als Akzentfarbe
- dezente Grautöne für Linien, Cards und Sekundärflächen

Die App muss vollständig responsive sein:
- Desktop
- iPad / Tablet
- Mobile

Icons:
- Verwende Font Awesome (CDN)
- Kategorien und Menüpunkte erhalten Icons
- Icons sind in der JSON konfigurierbar (z.B. "icon": "fa-user-shield")
- Dezente Darstellung, keine überladene UI

Fragetypen:
- Radio Cards (Ja / Nein / Unbekannt)
- Dropdowns
- Checkbox-Gruppen
- Bewertungsskala (1–5)
- Ampel (Grün / Gelb / Rot / Unbekannt)

Funktional:
- Antworten im Browser-State speichern
- Dynamisches Rendering aller Fragen
- Keine hardcodierten Fragen im JS
- Risikoauswertung automatisch berechnen:
  - Grün: kompatibel
  - Gelb: prüfen
  - Rot: kritisch
  - Grau: unklar

Technische Anforderungen:
- Nur HTML, CSS, Vanilla JavaScript
- Keine Frameworks
- Keine Build Tools
- Lokal im Browser lauffähig
- Saubere Trennung von Struktur, Design und Logik
- Gut kommentierter Code
- Wartbare Struktur

Code-Qualität:
- Saubere Komponentenstruktur in JavaScript
- Fragen, Antwortoptionen und Risiko-Mapping ausschliesslich in /data/survey-config.json definieren
- JavaScript darf keine Fragen oder Antwortoptionen hardcoden
- Rendering dynamisch aus der JSON-Konfiguration
- Gut kommentierter Code
- Wartbar und erweiterbar
- Keine Businesslogik im HTML
- Klare Trennung von Struktur, Design und Logik

Erzeuge folgende Dateien vollständig:
- index.html
- /styles/styles.css
- /js/main.js
- /data/survey-config.json
```
