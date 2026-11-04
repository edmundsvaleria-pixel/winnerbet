// src/types/index.d.ts

// 1. Fix for Node.js process.env
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: string;
    PAYSTACK_SECRET_KEY: string;
    
    NEXT_PUBLIC_BSD_API_KEY: string;
    SCORIO_API_KEY: string;
    ODDS_API_KEY: string;
    TENNIS_API_KEY: string;
    
    RAPIDAPI_KEY: string;
  }
}

// 2. Fix for Paystack Inline JS (since it has no official types)
declare module '@paystack/inline-js' {
  export default class PaystackPop {
    constructor();
    newTransaction(options: {
      key: string;
      email: string;
      amount: number;
      currency?: string;
      ref?: string;
      onSuccess?: (transaction: { reference: string }) => void;
      onCancel?: () => void;
    }): void;
  }
}

// 3. Fix for CSS imports (if you use them)
declare module '*.css';
declare module '*.scss';