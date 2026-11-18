import { dictionaries } from "./dictionaries";
import { getLocale } from "./server";
import { translate, type MessageKey } from "./translate";

/**
 * Translation for server-only text: the page title and the description in
 * `metadata`. Components use `useT()`; nothing else should reach for this.
 */
export async function translateOnServer(key: MessageKey): Promise<string> {
  const locale = await getLocale();
  return translate(dictionaries[locale], key);
}

/** The per-page `<title>`, in the language the reader chose. */
export async function titleMetadata(key: MessageKey) {
  return { title: await translateOnServer(key) };
}
