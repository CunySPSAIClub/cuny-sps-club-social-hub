/**
 * Swappable institutional identity provider adapter layer.
 *
 * Today: GoogleIdentityAdapter (Google Identity Services) restricted to
 * @spsmail.cuny.edu and @sps.cuny.edu on the server.
 *
 * Later: Swap in CunySsoAdapter (official CUNY Login / OIDC / SAML) without
 * modifying LoginView or OnboardingFlow screens.
 */

export interface IdentityCredentialResult {
  provider: 'google' | 'cuny-sso';
  credential: string;
}

export interface IdentityProviderAdapter {
  readonly id: 'google' | 'cuny-sso';
  readonly displayName: string;
  isConfigured(clientId: string): boolean;
  loadScript(): Promise<void>;
  renderSignInButton(options: {
    container: HTMLElement;
    clientId: string;
    onCredential: (result: IdentityCredentialResult) => void;
    onError: (message: string) => void;
  }): Promise<void>;
}

interface GoogleAccountsIdApi {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      width?: number | string;
      logo_alignment?: 'left' | 'center';
    }
  ) => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsIdApi;
      };
    };
  }
}

let gsiScriptPromise: Promise<void> | null = null;

export const GoogleIdentityAdapter: IdentityProviderAdapter = {
  id: 'google',
  displayName: 'Google Sign-In (CUNY SPS)',

  isConfigured(clientId: string): boolean {
    return clientId.trim().length > 0;
  },

  loadScript(): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();
    if (window.google?.accounts?.id) return Promise.resolve();
    if (gsiScriptPromise) return gsiScriptPromise;

    gsiScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener(
          'error',
          () => reject(new Error('Unable to load Google Sign-In.')),
          { once: true }
        );
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        gsiScriptPromise = null;
        reject(new Error('Unable to load Google Sign-In right now.'));
      };
      document.head.appendChild(script);
    });

    return gsiScriptPromise;
  },

  async renderSignInButton({ container, clientId, onCredential, onError }) {
    if (!this.isConfigured(clientId)) {
      return;
    }
    try {
      await this.loadScript();
      const gsi = window.google?.accounts?.id;
      if (!gsi) {
        onError('Google Sign-In is temporarily unavailable.');
        return;
      }
      gsi.initialize({
        client_id: clientId.trim(),
        callback: (response) => {
          if (response.credential) {
            onCredential({ provider: 'google', credential: response.credential });
          } else {
            onError('Google Sign-In did not return an institutional credential.');
          }
        },
        auto_select: false,
      });
      container.innerHTML = '';
      gsi.renderButton(container, {
        theme: 'filled_blue',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 320,
        logo_alignment: 'left',
      });
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to initialize Google Sign-In.');
    }
  },
};

/**
 * Placeholder adapter for future CUNY Login SSO (OIDC/SAML) migration.
 * Replace ACTIVE_IDENTITY_PROVIDER with CunySsoAdapter when CUNY SSO goes live.
 */
export const CunySsoAdapter: IdentityProviderAdapter = {
  id: 'cuny-sso',
  displayName: 'CUNY Login (SSO)',
  isConfigured: () => false,
  loadScript: async () => Promise.resolve(),
  renderSignInButton: async ({ onError }) => {
    onError('CUNY Login SSO is not yet enabled in this environment.');
  },
};

export function getIdentityProviderAdapter(
  provider: 'google' | 'cuny-sso' = 'google'
): IdentityProviderAdapter {
  return provider === 'cuny-sso' ? CunySsoAdapter : GoogleIdentityAdapter;
}
