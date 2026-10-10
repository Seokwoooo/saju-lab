declare namespace Cloudflare {
  interface Env {
    DB?:D1Database;
    BUCKET?:R2Bucket;
    SITE_URL?:string;
    AI_ENABLED?:string;
    OPENROUTER_API_KEY?:string;
    OPENROUTER_AZURE_MODEL?:string;
    OPENROUTER_AZURE_CANONICAL_MODEL?:string;
    AI_PRIMARY_RESPONSE_MODE?:string;
    AI_PRIMARY_REASONING_EFFORT?:string;
    AI_IP_HMAC_KEY?:string;
    AI_AZURE_BYOK_ONLY_CONFIRMED?:string;
    AI_DAILY_CALL_LIMIT?:string;
    AI_DAILY_BUDGET_USD?:string;
    AI_JOB_RESERVE_USD?:string;
    AI_MAX_OUTPUT_TOKENS?:string;
    AI_MAX_PROMPT_PRICE_PER_MILLION?:string;
    AI_MAX_COMPLETION_PRICE_PER_MILLION?:string;
  }
}
