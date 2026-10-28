import {ensureCategory} from "../modules/products/services/category.service.js";
import "dotenv/config";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { parseProductWorkbook } from "../modules/products/services/product-import.service.js";
import { ProductModel } from "../modules/products/models/product.model.js";
import { ProductImport } from "../modules/products/models/product-import.model.js";
import { createHash } from "node:crypto";

async function run() {
  const paths = process.argv.slice(2).filter((p) => p !== "--commit");
  const parsed = await Promise.all(
    paths.map(async (path) => {
      const buffer = await readFile(path);
      return { path, buffer, ...(await parseProductWorkbook(buffer)) };
    }),
  );
  for (const file of parsed)
    console.log(
      JSON.stringify({
        file: file.path,
        records: file.products.length,
        errors: file.errors,
      }),
    );
  if (parsed.some((p) => p.errors.length))
    throw Error("Fix workbook validation errors before import.");
  if (!process.argv.includes("--commit")) return;
  await connectDatabase();
  if (mongoose.connection.readyState !== 1)
    throw Error("A database connection is required.");
  const slugs = parsed.flatMap((f) => f.products.map((p) => String(p.product.slug)));
  const existing = await ProductModel.find({ slug: { $in: slugs } }).lean();
  await mkdir("backups", { recursive: true });
  const backup = join("backups", "tagged-catalogue-" + Date.now() + ".json");
  await writeFile(backup, JSON.stringify(existing, null, 2));
  let created = 0,
    updated = 0;
  for (const file of parsed) {
    const batch = await ProductImport.create({
      filename: file.path.split(/[\\/]/).pop(),
      hash: createHash("sha256").update(file.buffer).digest("hex"),
      sheets: file.sheets,
    });
    for (const entry of file.products) {
      await ensureCategory(String(entry.product.category));
      const old = existing.find((p) => p.slug === entry.product.slug);
      const images = old?.images?.filter(
        (img) => img.url && img.url !== "/file.svg",
      );
      const data = {
        ...entry.product,
        status: "published",
        ...(images?.length ? { images } : {}),
        importBatch: batch._id,
      };
      await ProductModel.findOneAndUpdate(
        { slug: String(entry.product.slug) },
        { $set: data },
        { upsert: true, runValidators: true },
      );
      if (old) updated++;
      else created++;
    }
  }
  console.log(JSON.stringify({ created, updated, backup }));
}
run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
