import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { supabaseAdmin } from '@/server/supabase-admin';
import { Bucket } from '@/server/bucket';
import { TRPCError } from '@trpc/server';
import type { Prisma } from '@prisma/client';

export const productRouter = createTRPCRouter({
    getProduct: protectedProcedure
        .input(
            z.object({
                categoryId: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { db } = ctx;

            const whereClause: Prisma.ProductWhereInput = {};

            if (input.categoryId !== 'ALL') {
                whereClause.categoryId = input.categoryId;
            }

            const products = await db.product.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    price: true,
                    imageUrl: true,
                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            return products;
        }),

    createProduct: protectedProcedure
        .input(
            z.object({
                name: z.string().min(3).max(30),
                price: z.coerce.number().min(1000),
                imageUrl: z.string().url(),
                categoryId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { db } = ctx;

            const newProduct = await db.product.create({
                data: {
                    name: input.name,
                    price: input.price,
                    imageUrl: input.imageUrl,
                    category: {
                        connect: {
                            id: input.categoryId,
                        },
                    },
                },
            });

            return newProduct;
        }),

    createSupabaseSignedUploadUrl: protectedProcedure.mutation(async () => {
        const { data, error } = await supabaseAdmin.storage.from(Bucket.ProductImages).createSignedUploadUrl(`${Date.now()}.jpeg`);

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

        return data;
    }),

    updateProduct: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(3).max(30),
                price: z.coerce.number().min(1000),
                imageUrl: z.string().url(),
                categoryId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { db } = ctx;

            const updateProduct = await db.product.update({
                where: { id: input.id },
                data: {
                    name: input.name,
                    price: input.price,
                    imageUrl: input.imageUrl,
                    categoryId: input.categoryId,
                },
            });

            return updateProduct;
        }),

    deleteProduct: protectedProcedure
        .input(
            z.object({
                productId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { db } = ctx;

            const { imageUrl } = await db.product.delete({
                where: { id: input.productId },
            });

            await supabaseAdmin.storage
                .from(Bucket.ProductImages)
                .remove([imageUrl!.split('https://wyfusmqykdoilusimidr.supabase.co/storage/v1/object/public/product-images/')[1]!]);
        }),
});
