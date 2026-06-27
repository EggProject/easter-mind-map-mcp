# Tool referencia

🇬🇧 **[English version ->](../en/tool-reference.md)**

Ez az oldal összefoglalja a stdio szerver által exponált MCP toolokat. A pontos
LLM-facing szöveg a `src/mcp/toolDescriptions.ts` fájlban él.

## Toolok

| Tool                     | Hasznalat                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `mindmap_create`         | Perzisztens terv létrehozása és az első generálási futás sorba állítása.           |
| `mindmap_continue`       | Finomítási instrukció hozzáadása egy meglévő tervhez.                              |
| `mindmap_get_status`     | Rovid progress metadata polling egy tervhez.                                       |
| `mindmap_get_result`     | Aktuális vagy végső map olvasása `outline`, `markdown` vagy `summary` formátumban. |
| `mindmap_cancel`         | Sorban álló vagy futó munka megszakítása egy tervhez.                              |
| `mindmap_list`           | Caller-owned tervek listazasa rovid metadataval.                                   |
| `mindmap_document_add`   | Lokális PDF regisztrálása és feltöltése későbbi RAG használathoz.                  |
| `mindmap_document_index` | Feltöltött PDF inicializálása az upstream RAG indexben.                            |
| `mindmap_export`         | Commitolt tervverzió exportálása OPML, PNG vagy Markdown formátumba.               |
| `mindmap_guide`          | Determinisztikus tool-használati recept visszaadása a hostnak.                     |

## Fő erőforrások

| URI                                     | Tartalom                               |
| --------------------------------------- | -------------------------------------- |
| `mindmap://guide`                       | Tool-használati útmutató Markdownként. |
| `mindmap://plans/{planningId}`          | Tarolt terv JSON.                      |
| `mindmap://plans/{planningId}/outline`  | Aktuális outline JSON.                 |
| `mindmap://plans/{planningId}/markdown` | Aktuális map Markdown.                 |
| `mindmap://plans/{planningId}/events`   | Eseménynapló NDJSON-ként.              |
| `mindmap://exports/{planningId}/opml`   | OPML export.                           |
| `mindmap://exports/{planningId}/png`    | PNG export.                            |

## Végső lépés szabály

Az elvárt sikeres flow ezzel zárul:

```text
mindmap_export({ planningId, formats: ["opml", "png"] })
```

A `mindmap_get_result` a map tartalmának megtekintésére való; a
`mindmap_export` a leadható artifactokat hozza létre.
