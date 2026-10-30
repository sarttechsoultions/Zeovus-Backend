import { workbookImages } from "./workbook-images.js";
import JSZip from "jszip";
import ExcelJS from "exceljs";
import { productSchema } from "../validators/product.validator.js";
const lines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((s) => s.replace(/^\s*(?:[•\-]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
const slug = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export async function parseProductWorkbook(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  let expanded = 0;
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    const size =
      (entry as unknown as { _data?: { uncompressedSize?: number } })._data
        ?.uncompressedSize || 0;
    expanded += size;
    if (expanded > 40 * 1024 * 1024)
      throw new Error("Workbook expands beyond 40 MB.");
    if (entry.name.endsWith(".rels")) {
      // Drawing annotations are not catalogue fields; unsupported VML filenames
      // must not prevent reading the cell data. The supplied file is untouched.
      const xml = (await entry.async("string")).replace(/Target="\/xl\/([^\"]+)"/g, entry.name.startsWith('xl/worksheets/')?'Target="../$1"':'Target="$1"').replace(/<Relationship\b[^>]*Type="[^\"]*\/vmlDrawing"[^>]*\/>/g, '');
      zip.file(entry.name, xml);
    }
    if (entry.name.endsWith(".xml")) {
      let xml = await entry.async("string");
      const prefix = xml.match(
        /xmlns:([A-Za-z0-9_]+)="http:\/\/schemas.openxmlformats.org\/spreadsheetml\/2006\/main"/,
      )?.[1];
      if (prefix) {
        xml = xml
          .replace(new RegExp("(<\\/?)(?:" + prefix + "):", "g"), "$1")
          .replace(
            "xmlns:" +
              prefix +
              '="http://schemas.openxmlformats.org/spreadsheetml/2006/main"',
            'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"',
          );
        zip.file(entry.name, xml);
      }
    }
  }
  const normalized = await zip.generateAsync({ type: "nodebuffer" });
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(normalized as never);
  const products: {
    row: number;
    sheet: string;
    product: Record<string, unknown>;
  }[] = [];
  const errors: { sheet: string; row: number; message: string }[] = [];
  const sheets: { name: string; rows: string[][] }[] = [];
  for (const sheet of workbook.worksheets) {
    if (sheet.rowCount > 2500 || sheet.columnCount > 80)
      throw new Error("Workbook exceeds 2,500 rows or 80 columns per sheet.");
    const rows: string[][] = [];
    sheet.eachRow({ includeEmpty: true }, (row) => {
      const cells: string[] = [];
      for (let i = 1; i <= sheet.columnCount; i++) {
        const c = row.getCell(i);
        const v = c.value;
        cells.push(
          v && typeof v === "object" && "hyperlink" in v
            ? String(v.text || v.hyperlink)
            : c.text,
        );
      }
      rows.push(cells);
    });
    sheets.push({ name: sheet.name, rows });
    const headerIndex = rows.findIndex(
      (r) =>
        (r.includes("Product Name") && r.includes("Product Overview")) ||
        (r.includes("Botanical Name") && r.includes("Description")) ||
        (r.includes("Ingredient") && r.includes("Ingredient Group")) ||
        (r.includes("Product") && r.includes("Source & origin")),
    );
    if (headerIndex < 0) continue;
    const headers = rows[headerIndex];
    const herbal = headers.includes("Botanical Name");
    const protein = headers.includes("Product Name");
    const biotic = headers.includes("Ingredient Group");
    for (let index = headerIndex + 1; index < rows.length; index++) {
      const cells = rows[index];
      const source: Record<string, string> = Object.fromEntries(
        headers.map((h, i) => [h, cells[i] || ""]).filter(([h]) => !!h),
      );
      const name =
        source[
          herbal
            ? "Botanical Name"
            : protein
              ? "Product Name"
              : biotic
                ? "Ingredient"
                : "Product"
        ]?.trim();
      if (
        !name ||
        (!herbal && !protein && !biotic && !/^\d+$/.test(source["No."] || ""))
      )
        continue;
      const description =
        source[
          herbal
            ? "Description"
            : protein || biotic
              ? "Product Overview"
              : "Product description (100–150 words)"
        ] ||
        Object.entries(source).find(([k]) =>
          k.startsWith("Product description"),
        )?.[1] ||
        "";
      if (!description) {
        errors.push({
          sheet: sheet.name,
          row: index + 1,
          message: "Missing product description",
        });
        continue;
      }
      const spec =
        source[
          herbal
            ? "Standardization (common grades)"
            : protein || biotic
              ? "Technical Specifications"
              : "Technical specifications & available grades"
        ] || "";
      const specRows = lines(spec).map((line) => {
        const split = line.indexOf(":");
        return {
          parameter: split > 0 ? line.slice(0, split).trim() : "Specification",
          values: [split > 0 ? line.slice(split + 1).trim() : line],
        };
      });
      if (protein) {
        for (const title of [
          "Available Grades & Protein Concentrations",
          "Available Forms",
        ])
          for (const line of lines(source[title] || ""))
            specRows.push({ parameter: title, values: [line] });
      }
      const studies: {
        title: string;
        summary: string;
        url: string;
        pmid?: string;
      }[] = [];
      for (const [key, value] of Object.entries(source)) {
        if (!/^(?:Clinical Study \d|Study \d|Other Study Links)$/i.test(key))
          continue;
        const urls = [...value.matchAll(/https?:\/\/[^\s|<>]+/g)].map((m) =>
          m[0].replace(/[),.;]+$/, ""),
        );
        for (const url of urls) {
          const pmid = url.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/)?.[1];
          studies.push({
            title: key,
            summary: herbal
              ? source["Clinical Studies (one-line findings)"] ||
                source["Clinical Evidence Scope"] ||
                value
              : value,
            url,
            ...(pmid ? { pmid } : {}),
          });
        }
      }
      let images;
      try {
        images = workbookImages(source, name);
      } catch (error) {
        errors.push({
          sheet: sheet.name,
          row: index + 1,
          message: (error as Error).message,
        });
        continue;
      }
      const raw = {
        name,
        slug: slug(name),
        category: herbal
          ? "botanical-extracts"
          : protein
            ? "plant-proteins"
            : "collagen-gelatin",
        summary: description.slice(0, 1900),
        status: "published",
        images,
        description: description.split(/\n\s*\n/).filter(Boolean),
        applications: lines(source.Applications || "").map((title) => ({
          title,
        })),
        technicalSpecifications: {
          columns: ["Specification / grade"],
          rows: specRows,
        },
        sourceAndOrigin: lines(
          source[herbal ? "Plant Part Used" : "Source & origin"] || "",
        ).map((title) => ({
          title,
          label: herbal ? "Plant part" : "Source as supplied",
        })),
        processingAndQualityParameters: lines(
          source["Critical processing & quality parameters"] || "",
        ),
        qualityDocumentation: lines(
          source[protein ? "Quality & Compliance" : "Quality documentation"] ||
            "",
        ).map((title) => ({ title })),
        clinicalEvidence: studies.filter(
          (s, i) => studies.findIndex((other) => other.url === s.url) === i,
        ),
        technicalSourceIds: (source["Technical source IDs"] || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        sourceData: source,
      };
      if (biotic) {
        raw.category =
          (
            {
              Prebiotic: "prebiotics",
              Probiotic: "probiotics",
              Postbiotic: "postbiotics",
            } as Record<string, string>
          )[source["Ingredient Group"]] || "other";
        raw.processingAndQualityParameters = lines(
          source["Formulation & Processing Considerations"] || "",
        );
        raw.qualityDocumentation = lines(
          source["Quality & Documentation"] || "",
        ).map((title) => ({ title }));
        for (const line of lines(source["Composition & Identity"] || ""))
          specRows.push({
            parameter: "Composition & Identity",
            values: [line],
          });
      }
      const applicationTags = (source["Application Tags"] || "")
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s && s !== "No supported application identified");
      const applicationSubcategories = lines(
        source["Application Subcategory Tags"] || "",
      ).flatMap((line) => {
        const colon = line.indexOf(":");
        if (colon < 0) return [];
        const application = line.slice(0, colon).trim();
        return line
          .slice(colon + 1)
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((title) => ({ application, title }));
      });
      if (herbal) {
        raw.qualityDocumentation = lines(
          source["Quality Documents & Certifications (Europe)"] || "",
        ).map((title) => ({ title }));
        for (const study of studies) {
          const blocks = (source["Clinical Studies"] || "").split(/\n\s*\n/);
          study.summary =
            blocks.find((block) => block.includes(study.url)) ||
            source["Benefit Evidence & Sources"] ||
            study.summary;
        }
      }
      const result = productSchema.safeParse({
        ...raw,
        commonName: source["Common Name"] || "",
        standardization: herbal ? spec : "",
        plantPartUsed: source["Plant Part Used"] || "",
        benefits: lines(
          source.Benefits || source["Functional Characteristics"] || "",
        ),
        applicationTags,
        applicationSubcategories,
      });
      if (!result.success) {
        errors.push({
          sheet: sheet.name,
          row: index + 1,
          message: result.error.issues
            .map((i) => i.path.join(".") + ": " + i.message)
            .join("; "),
        });
        continue;
      }
      products.push({
        sheet: sheet.name,
        row: index + 1,
        product: result.data,
      });
    }
  }
  if (!products.length && !errors.length)
    throw new Error(
      "No supported catalogue found. Upload one of the botanical, collagen/gelatin or plant protein workbook layouts.",
    );
  return { products, errors, sheets };
}
