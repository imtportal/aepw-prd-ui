export const environment = {
  production: false,
  useMocks: false,
  apiBaseUrl: 'https://localhost:7213/api',
  // apiBaseUrl: 'http://localhost:5075/api',
  // apiBaseUrl2: 'http://localhost:3000/api',

  // apiBaseUrl:  'https://aepw-api-b7h7cuaugucffaf3.southeastasia-01.azurewebsites.net/api/',
  apiBaseUrl2: '',
  azure: {
    clientId: '',
    tenantId: '',
    redirectUri: 'http://localhost:4200',
    /**
     * Scope exposed by the backend ASP.NET Core API app registration.
     * This scope is requested when acquiring tokens for backend API calls.
     * Must match the scope defined under "Expose an API" in the Azure AD
     * app registration for the backend (not this SPA's registration).
     */
    apiScope: '',
  },
};
