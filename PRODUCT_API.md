# Product API

All endpoints require the `admin_session` cookie returned by admin login. Base URL: `http://localhost:5000/api/products`.

- `POST /` creates a product (201).
- `GET /` lists products with `page`, `limit` (max 100), `search`, `category`, and `status` filters.
- `GET /:id` retrieves a product by MongoDB ID.
- `PATCH /:id` or `PUT /:id` updates supplied fields; arrays and nested objects are replaced as whole values.
- `DELETE /:id` deletes a product.

Responses use `{ success, data }`. Lists also include `pagination`. Validation errors return 400, missing IDs return 404, duplicate slugs return 409, and unauthenticated requests return 401.

## Create body

```json
{
  "name": "Native Bovine Collagen",
  "slug": "native-bovine-collagen",
  "category": "collagen-gelatin",
  "summary": "Native collagen ingredient for qualified applications.",
  "status": "draft",
  "images": [{ "url": "/product-detail-assets/imgAchyranthesAsperaCloseUpFloweringSpike.png", "alt": "Product jar" }],
  "description": ["First description paragraph.", "Second description paragraph."],
  "applications": [{ "title": "Cell-culture coatings & laboratory scaffolds", "icon": "/product-detail-assets/imgSvg2.svg" }],
  "technicalSpecifications": {
    "columns": ["Native Type I Solution", "Freeze-dried Type I", "Atelocollagen"],
    "rows": [{ "parameter": "Purified Powder", "values": ["Moisture ≤10%", "Moisture ≤10%", "Moisture ≤10%"] }]
  },
  "sourceAndOrigin": [{ "title": "Cattle hide (skin)", "label": "Primary source", "icon": "/product-detail-assets/imgSvg14.svg" }],
  "processingAndQualityParameters": ["Declared species, tissue and collagen type"],
  "qualityDocumentation": [{ "title": "Batch Certificate of Analysis (CoA)", "url": "/documents/coa.pdf" }],
  "clinicalEvidence": [{ "title": "Study 1", "pmid": "25945821", "summary": "Study summary and limitations.", "url": "https://pubmed.ncbi.nlm.nih.gov/25945821/" }],
  "technicalSourceIds": ["R01", "R02", "R03", "R04"],
  "seo": { "title": "Native Bovine Collagen | Zeovus Herbs", "description": "Product overview." }
}
```

Categories: `botanical-extracts`, `collagen-gelatin`, `prebiotics`, `plant-proteins`, `other`. Status is `draft` or `published`; default is `draft`. Each specification row must have exactly one value for each grade column. Images and document files use URLs/paths; file upload is not part of these endpoints. All product-detail sections can contain multiple entries. Timestamps are generated automatically. Public catalogue/detail pages are not yet wired to these admin APIs.

Run validation/model tests with `npm run build` followed by `node --test tests/products.test.mjs`.

## Excel imports

`POST /api/products/import` accepts multipart form data with one `file` field (.xlsx, maximum 10 MB). The default response previews products, duplicate slugs and row errors without writing records. Send the same file to `POST /api/products/import?commit=true` to create drafts. Existing slugs are skipped; invalid workbooks/rows are rejected. Partial storage failures report created counts and row errors; retrying skips previously created slugs.

Supported layouts are the supplied Indian herbal catalogue, collagen/gelatin research catalogue and plant protein research database. Header rows are detected after introductory text. Reference sheets are archived with the import batch. Original product columns are retained in `sourceData`, including benefit groups, safety notes, study limitations and source URLs. The admin product editor shows these under Original workbook research & notes.

Technical text is preserved in a one-column specification table rather than guessing numerical grade equivalence. Products without supplied pictures use an explicit placeholder; add actual images before publishing. No Excel formulas or hyperlinks are executed or fetched. Uploading does not automatically publish products.
