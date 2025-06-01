import { createQRIS, xenditPaymentMethodClient } from '@/server/xendit';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { OrderStatus, Prisma } from '@prisma/client';

export const orderRouter = createTRPCRouter({
    createOrder: protectedProcedure
        .input(
            z.object({
                orderItems: z.array(
                    z.object({
                        productId: z.string(),
                        quantity: z.number().min(1),
                    })
                ),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { db } = ctx;
            const { orderItems } = input;

            const products = await db.product.findMany({ where: { id: { in: orderItems.map((item) => item.productId) } } });

            let subTotal = 0;

            products.forEach((product) => {
                const productQuantity = orderItems.find((item) => item.productId === product.id)!.quantity;

                const totalPrice = product.price * productQuantity;

                subTotal += totalPrice;
            });

            const tax = subTotal * 0.1;
            const grandTotal = subTotal + tax;

            const order = await db.order.create({
                data: {
                    subTotal,
                    tax,
                    grandTotal,
                },
            });

            const newOrderItems = await db.orderItem.createMany({
                data: products.map((product) => {
                    const productQuantity = orderItems.find((item) => item.productId === product.id)!.quantity;

                    return {
                        productId: product.id,
                        orderId: order.id,
                        price: product.price,
                        quantity: productQuantity,
                    };
                }),
            });

            const paymentRequest = await createQRIS({
                amount: grandTotal,
                orderId: order.id,
            });

            await db.order.update({
                where: {
                    id: order.id,
                },
                data: {
                    externalTransactionId: paymentRequest.id,
                    paymentMethodId: paymentRequest.paymentMethod.id,
                },
            });

            return {
                order,
                newOrderItems,
                qrString: paymentRequest.paymentMethod.qrCode?.channelProperties?.qrString,
            };
        }),

    simulatePayment: protectedProcedure
        .input(
            z.object({
                orderId: z.string().uuid(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { db } = ctx;

            const order = await db.order.findUnique({
                where: { id: input.orderId },
                select: {
                    paymentMethodId: true,
                    grandTotal: true,
                    externalTransactionId: true,
                },
            });

            if (!order) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Order Not Found',
                });
            }

            console.log(order.externalTransactionId);

            await xenditPaymentMethodClient.simulatePayment({
                paymentMethodId: order.paymentMethodId!,
                data: {
                    amount: order.grandTotal,
                },
            });
        }),

    checkOrderStatus: protectedProcedure
        .input(
            z.object({
                orderId: z.string().uuid(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { db } = ctx;

            const order = await db.order.findUnique({
                where: { id: input.orderId },
                select: {
                    payAt: true,
                    status: true,
                },
            });

            if (!order?.payAt) return false;

            return true;
        }),

    getOrders: protectedProcedure
        .input(
            z.object({
                status: z.enum(['ALL', ...Object.keys(OrderStatus)]),
            })
        )
        .query(async ({ ctx, input }) => {
            const { db } = ctx;

            const whereClause: Prisma.OrderWhereInput = {};

            switch (input.status) {
                case OrderStatus.AWAITING_PAYMENT:
                    whereClause.status = OrderStatus.AWAITING_PAYMENT;
                    break;
                case OrderStatus.PROCESSING:
                    whereClause.status = OrderStatus.PROCESSING;
                    break;
                case OrderStatus.DONE:
                    whereClause.status = OrderStatus.DONE;
                    break;
            }

            const orders = await db.order.findMany({
                where: whereClause,
                select: {
                    id: true,
                    grandTotal: true,
                    status: true,
                    payAt: true,
                    _count: {
                        select: {
                            OrderItems: true,
                        },
                    },
                },
            });

            return orders;
        }),

    finishOrder: protectedProcedure
        .input(
            z.object({
                orderId: z.string().uuid(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { db } = ctx;

            const order = await db.order.findUnique({
                where: { id: input.orderId },
                select: {
                    id: true,
                    payAt: true,
                    status: true,
                },
            });

            if (!order) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Order Not Found',
                });
            }

            if (!order.payAt) {
                throw new TRPCError({
                    code: 'UNPROCESSABLE_CONTENT',
                    message: 'order is not paid yet',
                });
            }

            if (order.status !== OrderStatus.PROCESSING) {
                throw new TRPCError({
                    code: 'UNPROCESSABLE_CONTENT',
                    message: 'order is not processing yet',
                });
            }

            return await db.order.update({
                where: { id: order.id },
                data: {
                    status: OrderStatus.DONE,
                },
            });
        }),

    getSalesReport: protectedProcedure.query(async ({ ctx }) => {
        const { db } = ctx;

        const paidOrdersQuery = db.order.findMany({
            where: { payAt: { not: null } },
            select: { grandTotal: true },
        });

        const onGoingOrdersQuery = db.order.findMany({
            where: { status: { not: 'DONE' } },
            select: { id: true },
        });

        const completedOrdersQuery = db.order.findMany({
            where: { status: 'DONE' },
            select: { id: true },
        });

        const [paidOrders, onGoingOrders, completedOrders] = await Promise.all([paidOrdersQuery, onGoingOrdersQuery, completedOrdersQuery]);

        const totalRevenue = paidOrders.reduce((a, b) => {
            return a + b.grandTotal;
        }, 0);

        const totalOnGoingOrders = onGoingOrders.length;

        const totalCompletedOrders = completedOrders.length;

        return {
            totalRevenue,
            totalOnGoingOrders,
            totalCompletedOrders,
        };
    }),
});
