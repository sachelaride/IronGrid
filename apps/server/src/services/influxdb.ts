/**
 * Utilitário de Conexão InfluxDB
 * 
 * Centraliza a configuração e o cliente de acesso ao banco de dados InfluxDB,
 * utilizado para armazenamento de séries temporais (métricas de CPU, RAM, Rede, etc).
 * 
 * @module services/influxdb
 */

import { InfluxDB } from '@influxdata/influxdb-client';
import { env } from '../utils/env';

// Configurações de conexão validadas no boot
const url = env.INFLUX_URL;
const token = env.INFLUX_TOKEN;
const org = env.INFLUX_ORG;
const bucket = env.INFLUX_BUCKET;

// Validação básica do Token para evitar erros de ingestão silenciosos
if (token === 'my-token' || !token) {
    console.warn('[InfluxDB Service] WARNING: InfluxDB token is missing or default. Ingestion will fail.');
} else {
    console.log('[InfluxDB Service] Initialized:', {
        url,
        org,
        bucket,
        tokenPrefix: token.substring(0, 5) + '...'
    });
}

/** Instância única do cliente InfluxDB configurada */
const influxDBClient = new InfluxDB({ url, token });

/**
 * Interface de abstração para operações comuns no InfluxDB.
 * Exporta APIs de Escrita (writeApi), Consulta (queryApi) e helpers.
 */
export const influxDB = {
    client: influxDBClient,
    /** API para envio de novos pontos de métricas */
    get writeApi() {
        return influxDBClient.getWriteApi(org, bucket);
    },
    /** API para execução de consultas Flux */
    get queryApi() {
        return influxDBClient.getQueryApi(org);
    },
    /** Nome da organização configurada */
    get org() { return org; },
    /** Nome do bucket de destino */
    get bucket() { return bucket; },
    
    /**
     * Helper para consulta de linhas (Rows)
     */
    queryRows: async (query: string) => {
        return await influxDBClient.getQueryApi(org).collectRows(query);
    }
};
