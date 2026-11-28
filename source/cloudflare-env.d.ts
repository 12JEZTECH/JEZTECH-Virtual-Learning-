declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    WORKSPACE_SERVICE_TOKEN?: string;
    BUCKET?: R2Bucket;
  }
}
declare namespace Cloudflare {
 interface Env {
  MPESA_B2B_INITIATOR?:string;
  MPESA_B2B_SECURITY_CREDENTIAL?:string;
  MPESA_B2B_SENDER_SHORTCODE?:string;
  MPESA_B2B_CALLBACK_BASE_URL?:string;
  MPESA_B2B_SANDBOX_ENABLED?:string;
  MPESA_CONSUMER_KEY?:string;
  MPESA_CONSUMER_SECRET?:string;
  MPESA_PASSKEY?:string;
  MPESA_SHORTCODE?:string;
  MPESA_CALLBACK_URL?:string;
  MPESA_LIVE_ENABLED?:string;
 }
}
