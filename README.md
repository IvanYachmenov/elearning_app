# E-learningová platforma pre výučbu programovania

Táto webová aplikácia je súčasťou bakalárskej práce
**„Webová aplikácia pre výučbu programovania s funkciou
automatizovaného hodnotenia riešení"** (FEI STU v Bratislave, 2026,
autor: Ivan Yachmenov).

Platforma umožňuje študentom prechádzať teoretický obsah a riešiť
praktické úlohy (voľbové aj programátorské) s automatickým
vyhodnocovaním kódu v Pythone a JavaScripte. Učitelia môžu
vytvárať a spravovať vlastné kurzy. Aplikácia je nasadená v
prostredí AWS Lightsail na adrese
<https://elearning-bp.duckdns.org>.

## Architektúra (skrátene)

- **Backend:** Django + Django REST Framework (Python)
- **Frontend:** React + TypeScript + Vite
- **Databáza:** PostgreSQL
- **Mikroservis Code Runner:** izolovaný Docker kontajner pre
  bezpečné spúšťanie Python kódu
- **Reverzná proxy:** Caddy (automatický TLS od Let's Encrypt)
- **Nasadenie:** Docker Compose na jedinej Lightsail inštancii

## Lokálne spustenie

Potrebné je iba `git`, `Docker Engine` a `docker compose v2`.

```bash
git clone https://github.com/IvanYachmenov/elearning_app.git
cd elearning_app
# v backend/ vytvor .env podľa šablóny v záverečnej práci (Dodatok A)
docker compose up --build
```

Frontend bude dostupný na <http://localhost:5173>, backend na
<http://localhost:8000>.

Úplný postup nasadenia a šablóna `.env` súboru sú uvedené v
záverečnej práci v Dodatku A (Používateľská príručka).
