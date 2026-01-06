export {};

declare global {
  interface Window {
    bmsApp?: {
      platform?: string;
    };
  }
}
