// App params - local mode (no base44 dependency)
export const appParams = {
  appId: 'local',
  token: null,
  fromUrl: typeof window !== 'undefined' ? window.location.href : '',
  functionsVersion: 'local',
  appBaseUrl: typeof window !== 'undefined' ? window.location.origin : '',
};
