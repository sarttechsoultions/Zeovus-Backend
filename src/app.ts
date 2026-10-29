import { newsletterRoutes } from "./newsletter.js";
import {contentRoutes} from './modules/content/routes/content.routes.js';
import {enquiryRoutes} from './modules/enquiries/routes/enquiry.routes.js';
import { productImageDirectory } from './modules/products/controllers/product-image.controller.js';
import { productRoutes } from './modules/products/routes/product.routes.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';
import { adminRoutes } from './modules/admin/routes/admin.routes.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';

export const app = express();
app.disable('x-powered-by');
// Production requests arrive through the hosting proxy. Use the real visitor IP
// for rate limiting instead of treating every Vercel request as one client.
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());
if (env.NODE_ENV !== 'test') app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.get('/api/health', (_request, response) => {
  response.json({ success: true, message: 'Backend is running' });
});
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'development' ? 1000 : 100,
  // Login has its own stricter limiter. Public catalogue reads are normal page-load
  // traffic and should not be blocked by the shared write/API limiter.
  skip: request => request.path === '/admin/login' || (request.method === 'GET' && (
    request.path === '/content/images' ||
    request.path === '/products/catalogue' ||
    request.path.startsWith('/products/catalogue/')
  )),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many API requests. Please wait and try again.' },
}));
app.use('/uploads/products',express.static(productImageDirectory,{dotfiles:'deny',index:false,maxAge:'1d',setHeaders:response=>{response.setHeader('X-Content-Type-Options','nosniff');}}));
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/enquiries',enquiryRoutes);
app.use('/api/content',contentRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
