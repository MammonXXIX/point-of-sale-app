import { PaymentRequest } from 'xendit-node';
import { addMinutes } from 'date-fns';

export const xenditPaymentRequestClient = new PaymentRequest({
    secretKey: process.env.XENDIT_MONEY_IN_KEY!,
});

type CreateQRISParams = {
    amount: number;
    orderId: string;
    expiredAt?: Date;
};

export const createQRIS = async ({ amount, orderId, expiredAt }: CreateQRISParams) => {
    const paymentRequest = await xenditPaymentRequestClient.createPaymentRequest({
        data: {
            currency: 'IDR',
            amount: amount,
            referenceId: orderId,
            paymentMethod: {
                reusability: 'ONE_TIME_USE',
                type: 'QR_CODE',
                qrCode: {
                    channelCode: 'DANA',
                    channelProperties: {
                        expiresAt: expiredAt ?? addMinutes(new Date(), 15),
                    },
                },
                referenceId: orderId,
            },
        },
    });

    return paymentRequest;
};
