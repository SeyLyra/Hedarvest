import { z } from 'zod';

const envSchema = z.object({
  HEDERA_OPERATOR_ID: z.string(),
  HEDERA_OPERATOR_KEY: z.string(),
  HEDERA_NETWORK: z.enum(['testnet','mainnet','previewnet']),
  HEDERA_JSON_RPC_URL: z.string().url(),
  EVM_PRIVATE_KEY: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(8),
  FARMER_PIN_SALT: z.string(),
  NEXT_PUBLIC_APP_URL: z.string().url()
});

export const env = envSchema.parse(process.env);
