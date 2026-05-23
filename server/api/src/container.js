/**
 * Dependency Injection Container.
 *
 * Wires up all layers: Repository → Service → Controller.
 * Each class receives its dependencies via the constructor,
 * following the Dependency Inversion Principle (DIP).
 *
 * This file is the ONLY place where concrete classes are instantiated.
 */

// Core
import prisma from './prisma.js';

// Repositories
import { ProductRepository } from './repositories/productRepository.js';
import { CategoryRepository } from './repositories/categoryRepository.js';
import { BrandRepository } from './repositories/brandRepository.js';
import { OrderRepository } from './repositories/orderRepository.js';
import { AuthRepository } from './repositories/authRepository.js';
import { ReviewRepository } from './repositories/reviewRepository.js';
import { SubscriptionRepository } from './repositories/subscriptionRepository.js';

// Services
import { ProductService } from './services/productService.js';
import { CategoryService } from './services/categoryService.js';
import { BrandService } from './services/brandService.js';
import { OrderService } from './services/orderService.js';
import { AuthService } from './services/authService.js';
import { ReviewService } from './services/reviewService.js';
import { PaymentService } from './services/paymentService.js';
import { EmailService } from './services/emailService.js';
import { SubscriptionService } from './services/subscriptionService.js';
import { PdfService } from './services/pdfService.js';

// Controllers
import { ProductController } from './controllers/productController.js';
import { CategoryController } from './controllers/categoryController.js';
import { BrandController } from './controllers/brandController.js';
import { OrderController } from './controllers/orderController.js';
import { AuthController } from './controllers/authController.js';
import { ReviewController } from './controllers/reviewController.js';
import { SubscriptionController } from './controllers/subscriptionController.js';

// ─── Instantiation ─────────────────────────────────────

// Repositories (depend on PrismaClient)
const productRepository = new ProductRepository(prisma);
const categoryRepository = new CategoryRepository(prisma);
const brandRepository = new BrandRepository(prisma);
const orderRepository = new OrderRepository(prisma);
const authRepository = new AuthRepository(prisma);
const reviewRepository = new ReviewRepository(prisma);
const subscriptionRepository = new SubscriptionRepository(prisma);

// Helper: function to fetch system settings (used by OrderService)
const getSettings = async () => {
    return prisma.systemSettings.findUnique({ where: { id: 'global-settings' } });
};

// Services (depend on Repositories)
const productService = new ProductService(productRepository, categoryRepository);
const categoryService = new CategoryService(categoryRepository);
const brandService = new BrandService(brandRepository);
const emailService = new EmailService();
const authService = new AuthService(authRepository, emailService);
const reviewService = new ReviewService(reviewRepository, productRepository);
const paymentService = new PaymentService();
const orderService = new OrderService(orderRepository, productService, getSettings, paymentService, emailService);
const subscriptionService = new SubscriptionService(subscriptionRepository, productService, paymentService, emailService);
const pdfService = new PdfService();

// Controllers (depend on Services)
const productController = new ProductController(productService);
const categoryController = new CategoryController(categoryService);
const brandController = new BrandController(brandService);
const orderController = new OrderController(orderService, pdfService);
const authController = new AuthController(authService);
const reviewController = new ReviewController(reviewService);
const subscriptionController = new SubscriptionController(subscriptionService);

// ─── Exports ───────────────────────────────────────────

export {
    productController,
    categoryController,
    brandController,
    orderController,
    authController,
    reviewController,
    subscriptionController,
    // subscriptionService exported directly for webhook route (no controller layer)
    subscriptionService,
    // orderService exported directly for webhook route (single payment handler)
    orderService,
    // paymentService exported directly for payment processing route
    paymentService,
    // emailService exported directly for routes without a controller layer (e.g. returns)
    emailService,
};

