export const environment = {
  production: true,
  useMocks: false,
  apiBaseUrl: '',
  apiBaseUrl2: '',
  azure: {
    clientId: '',
    tenantId: '',
    redirectUri: '',
    /**
     * Scope exposed by the backend ASP.NET Core API app registration.
     * Replace YOUR_CLIENT_ID with the actual client ID of the backend
     * API app registration in Azure AD (not this SPA's client ID).
     */
    apiScope: '',
  },
};
