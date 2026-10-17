import {EnquiryModel} from '../../enquiries/models/enquiry.model.js';
import type { RequestHandler } from 'express';
import { ProductModel } from '../../products/models/product.model.js';

export const getDashboard: RequestHandler = async (_request, response) => {
  const [counts, categories, recentProducts,enquiryTotal,newEnquiries] = await Promise.all([
    ProductModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          published: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] },
          },
          drafts: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] },
          },
        },
      },
    ]),
    ProductModel.aggregate([
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          published: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] },
          },
        },
      },
      { $sort: { total: -1, _id: 1 } },
    ]),
    ProductModel.find()
      .sort({ createdAt: -1, _id: -1 })
      .limit(5)
      .select('name slug category status images createdAt updatedAt')
      .lean(),
    EnquiryModel.countDocuments(), EnquiryModel.countDocuments({status:'new'}),
  ]);

  const stats = counts[0] || { total: 0, published: 0, drafts: 0 };
  response.set('Cache-Control', 'no-store').json({
    success: true,
    data: {
      statistics: {
        totalProducts: stats.total,
        publishedProducts: stats.published,
        draftProducts: stats.drafts,
        productCategories: categories.length,
      },
      categories: categories.map(category => ({
        category: category._id,
        total: category.total,
        published: category.published,
      })),
      recentProducts,
      enquiries: {
        available: true, total:enquiryTotal, new:newEnquiries,
        message: newEnquiries + " new enquiries out of " + enquiryTotal + " total.",
      },
    },
  });
};


