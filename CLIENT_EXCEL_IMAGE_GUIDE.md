# Client guide: product images in Excel

Keep the workbook's existing product columns. Add a column with the exact header **Image URLs**.

For one image, enter a direct public image URL. For multiple images, separate the links with a vertical bar (`|`) or put each URL on a new line in the same cell.

Example cell:

```text
https://example.com/products/pea-front.jpg | https://example.com/products/pea-back.jpg | https://example.com/products/pea-powder.png
```

The first URL is the main image. Following URLs form the product gallery. Up to 20 images per product are supported. Do not separate URLs with commas.

Alternatively, use separate columns:

```text
Image 1 URL | Image 1 Alt | Image 2 URL | Image 2 Alt | Image 3 URL | Image 3 Alt
```

Example values:

```text
https://example.com/front.jpg | Pea protein front view | https://example.com/back.jpg | Pea protein back view
```

Numbered columns are supported from 1 to 20. Alternative text is optional; the product name is used when absent. Use either the single-column or numbered-column format consistently. If both are used, Image URLs entries come first, followed by numbered entries; duplicates are removed.

URLs must begin with https:// or http:// and point directly to publicly accessible images. Prefer HTTPS. Links that require login or lead to a sharing/preview page are not suitable. Images pasted into worksheet cells are not imported. Preview images after import to verify the links work.

Excel URLs remain externally hosted; the application saves their links rather than downloading them. Keep these links available. For application-hosted images, open the product in admin and upload JPG, PNG, WebP or GIF files (up to 5 MB each). Multiple files can be selected together. Uploaded files are stored under backend/uploads/products; retain and back up this directory when deploying. The image list can also be edited manually and reordered using Make main.

No image URLs: the product receives a placeholder and remains a draft. Add the actual images before publishing. Re-uploading a workbook skips existing product slugs; update existing images using the product editor.
