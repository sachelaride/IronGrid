import { prisma } from './prisma';

export const SUPPORT_CONTACT = {
    name: 'German Sachelaride',
    email: 'sachelaride@gmail.com',
    phone: '(67) 9.9859-9051',
};

export const DONATION_PIX_KEYS = ['558252491-68', 'sachelaride@gmail.com'];

export type ProductEdition = 'full';

export const productEdition: ProductEdition = 'full';

export const PRODUCT_LIMITS = {
    assets: null,
    grafanaCharts: null,
};

const nativeChartActiveWhere = {
    OR: [
        { enabled: true },
        { autoEnabled: true },
    ],
};

export async function enforceGrafanaChartLimit() {
    await prisma.networkInterface.updateMany({
        where: {
            index: { lte: 0 },
            OR: [
                { enabled: true },
                { autoEnabled: true },
            ],
        },
        data: { enabled: false, autoEnabled: false },
    });
}

export async function getProductUsage() {
    await enforceGrafanaChartLimit();

    const [assets, grafanaCharts] = await Promise.all([
        prisma.device.count(),
        prisma.networkInterface.count({ where: nativeChartActiveWhere }),
    ]);

    return {
        edition: productEdition,
        limits: PRODUCT_LIMITS,
        usage: { assets, grafanaCharts },
        support: SUPPORT_CONTACT,
        donations: { pixKeys: DONATION_PIX_KEYS },
    };
}

export async function assertCanCreateAsset(_quantity = 1) {
}

export function assertGrafanaChartLimit(chartCount: number) {
    void chartCount;
}

export async function assertCanEnableGrafanaCharts(quantity = 1) {
    void quantity;
}
