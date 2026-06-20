import { WordPressSiteState } from '../models/fixify.models';

/** Empty WordPress state until API plugin data is loaded. */
export function createDefaultWordPressState(
  siteId: number,
  wpVersion = '6.4.0'
): WordPressSiteState {
  return {
    siteId,
    wpVersion,
    latestWpVersion: wpVersion,
    phpVersion: '8.2',
    activeTheme: 'Theme',
    themeVersion: '1.0.0',
    latestThemeVersion: '1.0.0',
    plugins: [],
    cachePlugin: '—',
    lastCacheClear: '—',
    lastCoreUpdate: '—',
    sslValid: true,
    dbOptimized: '—',
  };
}
