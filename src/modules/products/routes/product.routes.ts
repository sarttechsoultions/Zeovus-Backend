import {
  publicCatalogueNavigation,
  publicCatalogueOverview,
  publicProducts,
  publicProduct,
} from "../controllers/public-product.controller.js";
import {
  imageUpload,
  uploadProductImages,
} from "../controllers/product-image.controller.js";
import multer from "multer";
import { importProducts } from "../controllers/product-import.controller.js";
import { Router } from "express";
import { requireAdmin } from "../../../middlewares/auth.middleware.js";
import {
  bulkPublishProducts,
  bulkDeleteProducts,
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  validateId,
} from "../controllers/product.controller.js";
export const productRoutes = Router();
productRoutes.get("/catalogue", publicProducts);
productRoutes.get("/catalogue/overview", publicCatalogueOverview);
productRoutes.get("/catalogue/navigation", publicCatalogueNavigation);
productRoutes.get("/catalogue/:slug", publicProduct);
productRoutes.use(requireAdmin);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 0 },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith(".xlsx"))
      return cb(new Error("Only .xlsx files are supported"));
    cb(null, true);
  },
});
productRoutes.post("/images", imageUpload, uploadProductImages);
productRoutes.post("/import", upload.single("file"), importProducts);
productRoutes.route("/").post(createProduct).get(listProducts);
productRoutes.post("/bulk-publish", bulkPublishProducts);
productRoutes.post("/bulk-delete", bulkDeleteProducts);
productRoutes
  .route("/:id")
  .all(validateId)
  .get(getProduct)
  .patch(updateProduct)
  .put(updateProduct)
  .delete(deleteProduct);
