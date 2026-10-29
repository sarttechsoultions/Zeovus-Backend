import {catalogueCategories} from "../services/category.service.js";
import type { RequestHandler } from "express";
import { ProductModel } from "../models/product.model.js";
import { z } from "zod";
import { correctSearch } from "../services/search-spelling.js";

export const publicProducts: RequestHandler = async (req, res) => {
  const parsed = z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(30).default(6),
      category: z.string().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
      application: z.string().trim().min(1).max(200).optional(),
      subcategory: z.string().trim().min(1).max(200).optional(),
      search: z.string().trim().max(200).optional(),
    })
    .safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid filters" });
    return;
  }
  const { page, limit, category, application, subcategory, search } = parsed.data;
  const searchPattern = search?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter = {
    status: "published" as const,
    ...(searchPattern ? { $or: ["name", "commonName", "summary", "description", "benefits", "category", "applicationTags", "applicationSubcategories.title", "applications.title", "sourceAndOrigin.label", "technicalSpecifications.rows.values"].map(field => ({ [field]: { $regex: searchPattern, $options: "i" } })) } : {}),
    ...(category ? { category } : {}),
    ...(application ? { applicationTags: application } : {}),
    ...(subcategory
      ? {
          applicationSubcategories: {
            $elemMatch: {
              title: subcategory,
              ...(application ? { application } : {}),
            },
          },
        }
      : {}),
  };
  let correctedSearch: string | undefined;
  if (search && search.length >= 4 && !(await ProductModel.exists(filter))) {
    const documents = await ProductModel.find({ status: "published" }).select("name commonName category benefits applicationTags applicationSubcategories.title").lean();
    const vocabulary = documents.flatMap(document => [document.name, document.commonName || "", document.category, ...(document.benefits || []), ...(document.applicationTags || []), ...(document.applicationSubcategories || []).map(item => item.title || "")]);
    const corrected = correctSearch(search, vocabulary);
    if (corrected !== search.toLowerCase()) {
      correctedSearch = corrected;
      const pattern = corrected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = filter.$or?.map(condition => Object.fromEntries(Object.keys(condition).map(field => [field, { $regex: pattern, $options: "i" }])));
    }
  }
  const [data, total] = await Promise.all([
    ProductModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("name slug category summary images")
      .lean(),
    ProductModel.countDocuments(filter),
  ]);
  res.json({
    success: true,
    correctedSearch,
    data,
    pagination: { page, total, pages: Math.ceil(total / limit) },
  });
};
export const publicCatalogueNavigation: RequestHandler = async (_req, res) => {
  const products = await ProductModel.find({ status: "published" })
    .select("category applicationTags applicationSubcategories")
    .lean();
  const applications = new Map<string, Set<string>>();
  for (const product of products) {
    for (const tag of product.applicationTags || []) {
      if (!applications.has(tag)) applications.set(tag, new Set());
    }
    for (const sub of product.applicationSubcategories || []) {
      if (sub.application && sub.title && applications.has(sub.application))
        applications.get(sub.application)!.add(sub.title);
    }
  }

  res.json({
    success: true,
    data: {
      categories: await catalogueCategories(),
      applications: [...applications]
         .sort(([a],[b])=>a.localeCompare(b))
        .map(([title, subcategories]) => ({
          title,
          subcategories: [...subcategories].sort(),
        })),
    },
  });
};
export const publicCatalogueOverview: RequestHandler = async (_req, res) => {
  const projection = "name slug category summary images";
  const categories=await catalogueCategories();
  const groups = await Promise.all(
    categories.map(async ({id:category}) => {
      const [data, total] = await Promise.all([
        ProductModel.find({ status: "published", category })
          .sort({ createdAt: -1, _id: -1 })
          .limit(6)
          .select(projection)
          .lean(),
        ProductModel.countDocuments({ status: "published", category }),
      ]);
      return [
        category,
        { data, pagination: { page: 1, total, pages: Math.ceil(total / 6) } },
      ] as const;
    }),
  );
  res.json({ success: true, data: Object.fromEntries(groups) });
};
export const publicProduct: RequestHandler = async (req, res) => {
  if (
    typeof req.params.slug !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(req.params.slug)
  ) {
    res.status(400).json({ message: "Invalid product slug" });
    return;
  }
  const data = await ProductModel.findOne({
    slug: req.params.slug,
    status: "published",
  })
    .select("-sourceData -importBatch -__v")
    .lean();
  if (!data) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  res.json({ success: true, data });
};
