import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from "./locales";

/**
 * The language for the first render, taken from the cookie the switch writes.
 * Reading a cookie opts the app out of static prerendering, which is the price of
 * having <html lang> right before hydration instead of correcting it afterwards.
 */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
