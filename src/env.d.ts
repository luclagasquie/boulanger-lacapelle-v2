/// <reference path="../worker-configuration.d.ts" />

declare global {
  namespace Cloudflare {
    interface Env {
      ADMIN_PASSWORD?: string;
      ADMIN_SESSION_TOKEN?: string;
    }
  }

  interface Env {
    ADMIN_PASSWORD?: string;
    ADMIN_SESSION_TOKEN?: string;
  }
}

declare namespace App {
  interface Locals {
    flash?: {
      type: "error" | "success" | "info";
      message: string;
    };
  }
}

export {};
