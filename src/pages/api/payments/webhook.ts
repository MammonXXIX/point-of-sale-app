import { db } from '@/server/db';
import type { NextApiHandler } from 'next';

type XenditWebhookBody = {
    event: 'payment.succeeded';
    data: {
        id: string;
        amount: number;
        payment_request_id: string;
        reference_id: string;
        status: 'SUCCEEDED' | 'FAIlED';
    };
};

const handler: NextApiHandler = async (req, res) => {
    if (req.method !== 'POST') return;

    const headers = req.headers;
    const webhookToken = headers['x-callback-token'];

    if (webhookToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
        return res.status(401);
    }

    const body: XenditWebhookBody = req.body;

    const order = await db.order.findUnique({
        where: { id: body.data.reference_id },
    });

    if (!order) return res.status(404).send('Order Not Found');
    if (body.data.status !== 'SUCCEEDED') res.status(422).send('FAILED');

    await db.order.update({
        where: { id: order.id },
        data: {
            payAt: new Date(),
            status: 'PROCESSING',
        },
    });

    res.status(200);
};

export default handler;
