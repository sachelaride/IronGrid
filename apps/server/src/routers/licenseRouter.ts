import { router, protectedProcedure } from '../trpc';
import { getProductUsage } from '../utils/productEdition';

export const licenseRouter = router({
    getStatus: protectedProcedure.query(async () => {
        return getProductUsage();
    }),
});
