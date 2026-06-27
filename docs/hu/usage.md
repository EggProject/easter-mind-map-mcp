# Használat

🇬🇧 **[English version ->](../en/usage.md)**

Az MCP host ezt a szervert állapottartó workflow adapterként kezelje. A
`mindmap_create` legyen az első lépés, utána status polling következzen, az
eredményt csak szükség esetén olvasd, a folyamat végén pedig exportálj.

## Alap workflow

1. Hívd a `mindmap_create` toolt a felhasználó témájával vagy céljával.
2. Pontosan őrizd meg a visszakapott `planningId` értéket.
3. Pollingold a `mindmap_get_status` toolt, amig a terv `completed` vagy
   `failed` állapotba nem kerül.
4. Hivd a `mindmap_get_result` toolt `outline`, `markdown` vagy `summary`
   formátummal, ha a hostnak szüksége van a map tartalmára.
5. A végső válasz előtt hívd a `mindmap_export` toolt `opml` és `png`
   formatumokkal.

## Példa host szekvencia

```text
mindmap_create({ prompt: "Plan an Easter project" })
mindmap_get_status({ planningId })
mindmap_get_status({ planningId })
mindmap_get_result({ planningId, format: "outline" })
mindmap_export({ planningId, formats: ["opml", "png"] })
```

## Finomítás

Meglévő tervnél használd a `mindmap_continue` toolt:

```text
mindmap_continue({
  planningId,
  instruction: "Add a testing branch and make the deployment branch shorter."
})
```

Continuation után térj vissza a status pollinghoz. Ne indíts párhuzamos
continuationt ugyanarra a `planningId` értékre; a service tervenként
sorosításra épül.

## Dokumentummal támogatott mapek

PDF-alapú generáláshoz:

1. Tedd a PDF-et egy `MINDMAP_DOCUMENT_ROOTS` alatt engedélyezett könyvtárba.
2. Hivd a `mindmap_document_add` toolt `{ source: { type: "local_path", path } }`
   inputtal.
3. Hívd a `mindmap_document_index` toolt a visszakapott `documentId` értékkel.
4. Hívd a `mindmap_create` toolt ezzel a `documentId` értékkel.

Az adapter átadja a dokumentumot az upstreamnek, és stabil caller-facing
`documentId` értéket tart fenn.

## Kimenetek

A generált artifactok MCP resource linkként jönnek vissza, nem inline bináris
payloadként. A `mindmap://exports/{planningId}/opml` vagy
`mindmap://exports/{planningId}/png` erőforrást csak akkor olvasd, ha a hostnak
szüksége van az artifact tartalmára.
