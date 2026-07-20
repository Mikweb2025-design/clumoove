/// <reference types="vite/client" />

declare global {
  const __APP_VERSION__: string

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
