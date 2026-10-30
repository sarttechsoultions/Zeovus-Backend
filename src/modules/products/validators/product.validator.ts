import { z } from "zod";
const text = z.string().trim().min(1).max(10000);
const asset = z
  .string()
  .max(2048)
  .refine(
    (value) => /^https?:\/\//.test(value) || /^\/(?!\/)/.test(value),
    "Use an http(s) URL or local absolute path",
  );
const icon = asset.optional();
export const productSchema = z
  .object({
    sourceData: z.record(z.string(), z.string()).optional(),
    name: text.max(200),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(200),
    category: z.string().trim().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    commonName: z.string().max(500).optional(),
    standardization: z.string().max(10000).optional(),
    plantPartUsed: z.string().max(10000).optional(),
    benefits: z.array(text).max(100).optional(),
    applicationTags: z.array(text.max(200)).max(30).optional(),
    applicationSubcategories: z
      .array(
        z.object({ application: text.max(200), title: text.max(200) }).strict(),
      )
      .max(100)
      .optional(),
    summary: text.max(2000),
    status: z.enum(["draft", "published"]).default("published"),
    images: z
      .array(z.object({ url: asset, alt: text.max(500) }).strict())
      .min(1)
      .max(20),
    description: z.array(text).min(1).max(30),
    applications: z
      .array(z.object({ title: text.max(500), icon }).strict())
      .max(50)
      .default([]),
    technicalSpecifications: z
      .object({
        columns: z.array(text.max(200)).min(1).max(15),
        rows: z
          .array(
            z
              .object({
                parameter: text.max(200),
                values: z.array(z.string().max(2000)).max(15),
              })
              .strict(),
          )
          .max(100),
      })
      .strict(),
    sourceAndOrigin: z
      .array(
        z.object({ title: text.max(200), label: text.max(500), icon }).strict(),
      )
      .max(50)
      .default([]),
    processingAndQualityParameters: z.array(text).max(100).default([]),
    qualityDocumentation: z
      .array(z.object({ title: text, url: asset.optional() }).strict())
      .max(100)
      .default([]),
    clinicalEvidence: z
      .array(
        z
          .object({
            title: text.max(200),
            pmid: z.string().regex(/^\d+$/).optional(),
            summary: text,
            url: z.url().refine((u) => /^https?:\/\//.test(u)),
          })
          .strict(),
      )
      .max(100)
      .default([]),
    technicalSourceIds: z.array(text.max(100)).max(100).default([]),
    seo: z
      .object({
        title: z.string().max(200).optional(),
        description: z.string().max(500).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export function validTable(value: z.infer<typeof productSchema>): boolean {
  return value.technicalSpecifications.rows.every(
    (row) => row.values.length === value.technicalSpecifications.columns.length,
  );
}
export const productUpdateSchema = productSchema
  .extend({
    status: productSchema.shape.status.removeDefault(),
    applications: productSchema.shape.applications.removeDefault(),
    sourceAndOrigin: productSchema.shape.sourceAndOrigin.removeDefault(),
    processingAndQualityParameters:
      productSchema.shape.processingAndQualityParameters.removeDefault(),
    qualityDocumentation:
      productSchema.shape.qualityDocumentation.removeDefault(),
    clinicalEvidence: productSchema.shape.clinicalEvidence.removeDefault(),
    technicalSourceIds: productSchema.shape.technicalSourceIds.removeDefault(),
  })
  .partial();
