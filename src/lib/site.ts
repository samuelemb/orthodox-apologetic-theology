export const site = {
  name: "Orthodox Apologetic Theology",
  telegramUrl: "https://t.me/orthodox_chrstianity",
  logo: "/images/logo.jpg",
} as const;

export const navigation = [
  { href: "/", key: "home" },
  { href: "/teachings", key: "teachings" },
  { href: "/about", key: "about" },
  { href: "/feedback", key: "feedback" },
] as const;

export type PageKey = (typeof navigation)[number]["key"];

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
