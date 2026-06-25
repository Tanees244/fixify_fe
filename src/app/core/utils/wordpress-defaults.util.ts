import { WordPressSiteState } from '../models/fixify.models';

/** Empty WordPress state until live API data is loaded. */
export function createDefaultWordPressState(
  siteId: number,
  wpVersion = ''
): WordPressSiteState {
  return {
    siteId,
    wpVersion,
    latestWpVersion: wpVersion,
    phpVersion: '',
    activeTheme: '',
    themeVersion: '',
    latestThemeVersion: '',
    plugins: [],
    cachePlugin: '—',
    lastCacheClear: '—',
    lastCoreUpdate: '—',
    sslValid: true,
    dbOptimized: '—',
  };
}
