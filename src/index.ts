import { session } from 'electron';
import { downloadExtension, downloadFile } from './utils';

export * from './extensions';
export { downloadExtension, downloadFile };

export interface InstallOptions {
  /**
   * Force to download the extension even if it's already installed, default is `false`
   */
  forceDownload?: boolean;
  /**
   * Options for loading an unpacked extension.
   * @see https://www.electronjs.org/docs/latest/api/session#sesloadextensionpath-options
   */
  loadExtensionOptions?: Electron.LoadExtensionOptions;
}

/**
 * Install Chrome extension for Electron
 * @param extensionIds Extension id or ids
 * @param options Install options
 */
export async function installExtension(
  extensionIds: string,
  options?: InstallOptions,
): Promise<string>;

export async function installExtension(
  extensionIds: string[],
  options?: InstallOptions,
): Promise<string[]>;

export async function installExtension(
  extensionIds: string | string[],
  options?: InstallOptions,
): Promise<string | string[]> {
  const opts = Object.assign({}, options);
  const { loadExtensionOptions = {}, forceDownload } = opts;

  const loadExtensionOpts = Object.assign(
    {
      allowFileAccess: true,
    },
    loadExtensionOptions,
  );

  if (process.type !== 'browser') {
    return Promise.reject(
      new Error('electron-devtools-installer can only be used from the main process'),
    );
  }

  if (Array.isArray(extensionIds)) {
    return Promise.all(extensionIds.map(id => installExtension(id, options))) as Promise<string[]>;
  }

  let crxId: string;
  if (typeof extensionIds === 'string') {
    crxId = extensionIds;
  } else {
    return Promise.reject(new Error(`Invalid extensionReference passed in: "${extensionIds}"`));
  }

  return downloadExtension(crxId, { force: forceDownload }).then(extensionFolder => {
    return session.defaultSession
      .loadExtension(extensionFolder, loadExtensionOpts)
      .then(ext => {
        return Promise.resolve(ext.name);
      })
      .catch(err => {
        console.error(`Failed to install extension: ${crxId}`);
        console.error(err);
        return Promise.reject(err);
      });
  });
}

export default installExtension;
