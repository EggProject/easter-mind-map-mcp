# Tool referencia

🇬🇧 **[English version ->](../en/tool-reference.md)**

Ez az oldal összefoglalja a stdio szerver által exponált MCP toolokat. A pontos
LLM-facing szöveg a `src/mcp/toolDescriptions.ts` fájlban él, a paraméter
promptok pedig a `src/mcp/server.ts` fájlban vannak.

A tool- és paraméterleírások a promptfelület részei. Úgy vannak megírva, hogy a
host pontosan őrizze meg a visszakapott ID-kat, terminális státuszig polloljon,
kerülje a nem biztonságos dokumentumbemenetet, és sikeres mapnél OPML + PNG
exporttal zárjon.

## Toolok

| Tool                     | Hasznalat                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `mindmap_create`         | Memóriában tartott terv létrehozása és az első generálási futás sorba állítása.    |
| `mindmap_continue`       | Finomítási instrukció hozzáadása egy meglévő tervhez.                              |
| `mindmap_get_status`     | Rovid progress metadata polling egy tervhez.                                       |
| `mindmap_get_result`     | Aktuális vagy végső map olvasása `outline`, `markdown` vagy `summary` formátumban. |
| `mindmap_cancel`         | Sorban álló vagy futó munka megszakítása egy tervhez.                              |
| `mindmap_list`           | Caller-owned tervek listazasa rovid metadataval.                                   |
| `mindmap_document_add`   | Lokális PDF regisztrálása és feltöltése későbbi RAG használathoz.                  |
| `mindmap_document_index` | Feltöltött PDF inicializálása az upstream RAG indexben.                            |
| `mindmap_export`         | Commitolt tervverzió exportálása OPML, PNG vagy Markdown formátumba.               |
| `mindmap_guide`          | Determinisztikus tool-használati recept visszaadása a hostnak.                     |

## Paraméter prompt szabályok

- A `planningId`, `runId`, `documentId`, `resourceUri` és `version` értékek tool
  eredményből jönnek, és byte-pontosan meg kell őrizni őket.
- A `prompt` a felhasználói célt és map-korlátokat hordozza; nem API kulcs vagy
  host konfiguráció helye.
- A `documentId` csak akkor érvényes `mindmap_create` híváshoz, ha előtte a
  `mindmap_document_add` és a `mindmap_document_index` is sikeres volt.
- A `mindmap_document_add` `source.path` értéke allowed document root alatti
  lokális PDF út legyen. URL, base64, nyers byte és secret nem elfogadott.
- A `formats` elhagyható a kötelező alapértelmezett `["opml", "png"]`
  exporthoz; `markdown` csak akkor kell, ha tényleg hasznos.

## Fő erőforrások

| URI                                             | Tartalom                               |
| ----------------------------------------------- | -------------------------------------- |
| `mindmap://guide`                               | Tool-használati útmutató Markdownként. |
| `mindmap://plans/{planningId}`                  | Tarolt terv JSON.                      |
| `mindmap://plans/{planningId}/outline`          | Aktuális outline JSON.                 |
| `mindmap://plans/{planningId}/markdown`         | Aktuális map Markdown.                 |
| `mindmap://plans/{planningId}/events`           | Eseménynapló NDJSON-ként.              |
| `mindmap://exports/{planningId}/{version}/opml` | Lazy módon generált OPML export.       |
| `mindmap://exports/{planningId}/{version}/png`  | Lazy módon generált PNG export.        |

## Végső lépés szabály

Az elvárt sikeres flow ezzel zárul:

```text
mindmap_export({ planningId, formats: ["opml", "png"] })
```

A `mindmap_get_result` a map tartalmának megtekintésére való; a
`mindmap_export` verziózott resource linkeket hoz létre. Ezek olvasásakor hívja
az MCP a MindGeniusAI exportot.
