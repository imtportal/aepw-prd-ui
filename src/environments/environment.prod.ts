export const environment = {
  production: true,
  useMocks: false,
  apiBaseUrl: 'https://aepw-imt-api-eshugeamg9a7f7am.southeastasia-01.azurewebsites.net',
  apiBaseUrl2: 'https://aepw-imt-api-eshugeamg9a7f7am.southeastasia-01.azurewebsites.net',
  azure: {
    clientId: '90ef5c0d-6c0a-46fd-841b-fbdfe9dbdc8f',
    tenantId: 'b7387440-3ff7-4153-b1ca-1116e373b891',
    redirectUri: 'https://aepw-imt-ccf2djdvbsf3dyfe.southeastasia-01.azurewebsites.net',
    /**
     * Scope exposed by the backend ASP.NET Core API app registration.
     * Replace YOUR_CLIENT_ID with the actual client ID of the backend
     * API app registration in Azure AD (not this SPA's client ID).
     */
    apiScope: 'api://90ef5c0d-6c0a-46fd-841b-fbdfe9dbdc8f/access_as_user',
  },
};
