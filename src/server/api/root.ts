import { createCallerFactory, createTRPCRouter } from '@/server/api/trpc';
import { categoryRouter } from './routers/category';
import { productRouter } from './routers/product';
import { orderRouter } from './routers/order';

export const appRouter = createTRPCRouter({
    category: categoryRouter,
    product: productRouter,
    order: orderRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
