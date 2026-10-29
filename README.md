# StudioFlow_web

Sito pubblico di StudioFlow, pubblicato con GitHub Pages:

- `index.html`: landing page;
- `privacy/`: informativa privacy, compreso il collegamento con gli account Google;
- `google/ritorno/`: pagina di ritorno del collegamento con Google (OAuth). Rimanda il browser al
  server dell'ufficio indicato nel parametro `state`, solo se è un indirizzo di rete interna,
  Tailscale (100.64–127.x) o localhost. Non salva nulla e non carica risorse esterne.

Il piano è in `docs/PIANO_INTEGRAZIONE_GOOGLE.md` del repository di StudioFlow (§ 3.1 e § 3.5).

## Regole

- Repository pubblico: mai chiavi, password, client secret o dati di clienti.
- Nessuno script, font o statistica di terzi.
- Modifiche solo tramite pull request approvata.
