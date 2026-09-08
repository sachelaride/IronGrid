import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';
import { z } from 'zod';

// Inicialização do tRPC com Contexto Tipado
const t = initTRPC.context<Context>().create();

// Middleware de autenticação simples
const isAuthed = t.middleware(({ next, ctx }) => {
    if (!ctx.user) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Você deve estar autenticado para realizar esta ação.',
        });
    }

    return next({
        ctx: {
            user: ctx.user,
        },
    });
});

import { prisma } from './utils/prisma';

// Middleware de auditoria
const auditMiddleware = t.middleware(async ({ next, ctx, type, path, rawInput }) => {
    const result = await next();
    
    if (type === 'mutation' && ctx.user) {
        if (path.startsWith('auth.') || path.startsWith('system.') || path.startsWith('settings.') || path.startsWith('device.') || path.startsWith('user.')) {
            try {
                // Ignore login to prevent password logging
                if (path === 'auth.login') return result;

                await (prisma as any).auditLog.create({
                    data: {
                        userId: ctx.user.id,
                        action: path,
                        resource: path.split('.')[0],
                        details: rawInput ? JSON.stringify(rawInput) : undefined,
                        ipAddress: (ctx.req as any)?.ip || 'unknown'
                    }
                });
            } catch (e) {
                console.error('[AUDIT_ERROR] Falha ao registrar log de auditoria', e);
            }
        }
    }
    
    return result;
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed).use(auditMiddleware);

// Middleware para administradores
const isAdmin = isAuthed.unstable_pipe(({ next, ctx }) => {
    if (ctx.user.role !== 'ADMIN') {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acesso restrito a administradores.',
        });
    }

    return next({
        ctx: {
            user: ctx.user,
        },
    });
});

export const adminProcedure = t.procedure.use(isAdmin);
