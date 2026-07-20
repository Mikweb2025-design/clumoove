/// <reference types="vite/client" />
declare const __APP_VERSION__: string

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => void;
        onError: (err: unknown) => void;
      }) => {
        render: (selector: string) => void;
      };
    };
  }
}

export {}
