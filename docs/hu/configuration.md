# Konfiguráció

🇬🇧 **[English version ->](../en/configuration.md)**

A szerver indításkor környezeti változókból olvassa a konfigurációt. A relatív
utak a folyamat working directoryjából oldódnak fel.

## Környezeti változók

| Változó                        | Alapérték               | Cél                                                                                                             |
| ------------------------------ | ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `MINDGENIUS_BASE_URL`          | `http://127.0.0.1:8787` | A MindGeniusAI upstream HTTP szerver base URL-je.                                                               |
| `MINDGENIUS_START_COMMAND`     | nincs                   | Opcionális parancs az upstream indítására, ha a health check sikertelen.                                        |
| `MINDGENIUS_HEALTH_TIMEOUT_MS` | `30000`                 | Maximális várakozási idő az upstream health checkre indítás után.                                               |
| `MINDMAP_DATA_DIR`             | `data`                  | Lokális perzisztencia könyvtár tervekhez, futásokhoz, dokumentumokhoz, exportokhoz és idempotencia rekordokhoz. |
| `MINDMAP_DOCUMENT_ROOTS`       | `documents`             | Vesszővel elválasztott könyvtárlista, ahonnan lokális PDF dokumentum feltölthető.                               |
| `MINDMAP_MAX_RUNS_GLOBAL`      | `4`                     | Globális párhuzamos generálási limit.                                                                           |
| `MINDMAP_MAX_RUNS_PER_OWNER`   | `2`                     | Ownerenkénti párhuzamos generálási limit.                                                                       |
| `MINDMAP_MAX_DOCUMENT_INDEXES` | `2`                     | Párhuzamos dokumentumindexelési limit.                                                                          |
| `MINDMAP_UPSTREAM_TIMEOUT_MS`  | `180000`                | Egy upstream SSE keres timeoutja.                                                                               |
| `MINDMAP_MAX_RETRIES`          | `1`                     | Sikertelen sorba tett futások újrapróbálási száma.                                                              |

## Runtime könyvtárak

A `MINDMAP_DATA_DIR` az adapter saját állapotát tárolja. A szerver folyamat
számára írhatónak kell lennie, és ne használd forrásfájlokhoz.

A `MINDMAP_DOCUMENT_ROOTS` korlátozza, hogy a `mindmap_document_add` mely
lokális PDF-eket töltheti fel. Az ezeken kívüli utak már az upstream hívása
előtt elutasításra kerülnek.

## Upstream indítás

Ha a `MINDGENIUS_START_COMMAND` be van állítva, az adapter csak az első
sikertelen health check után, és szerverfolyamatonként csak egyszer indítja el.
A parancs whitespace mentén darabolódik, és Bun process runnerrel indul.

Összetett indítási parancshoz használj inkább egy kis wrapper scriptet, és a
`MINDGENIUS_START_COMMAND` arra a scriptre mutasson.
