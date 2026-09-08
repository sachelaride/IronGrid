import { TRPCError } from '@trpc/server';
import { prisma } from './prisma';

export const SUPPORT_CONTACT = {
    name: 'German Sachelaride',
    email: 'sachelaride@gmail.com',
    phone: '(67) 9.9859-9051',
};

export const DONATION_PIX_KEYS = ['558252491-68', 'sachelaride@gmail.com'];
const LIMITED_ASSET_LIMIT = 600;
const FULL_UNLOCK_TOKEN = '13042019';

export type ProductEdition = 'limited' | 'full';

export const productEdition: ProductEdition =
    process.env.IRONGRID_EDITION === FULL_UNLOCK_TOKEN && process.env.IRONGRID_GRAFANA_CHART_LIMIT === FULL_UNLOCK_TOKEN
        ? 'full'
        : 'limited';

export const PRODUCT_LIMITS = {
    assets: productEdition === 'limited' ? LIMITED_ASSET_LIMIT : null,
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

export async function assertCanCreateAsset(quantity = 1) {
    if (!PRODUCT_LIMITS.assets) return;

    const current = await prisma.device.count();
    if (current + quantity > PRODUCT_LIMITS.assets) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Limite da versao fechada atingido: ${PRODUCT_LIMITS.assets} ativos cadastrados. Para ampliar, contate ${SUPPORT_CONTACT.name} em ${SUPPORT_CONTACT.email} ou ${SUPPORT_CONTACT.phone}.`,
        });
    }
}

export function assertGrafanaChartLimit(chartCount: number) {
    void chartCount;
}

export async function assertCanEnableGrafanaCharts(quantity = 1) {
    void quantity;
}
