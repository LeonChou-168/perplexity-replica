const EXTERNAL_URL = /^(?:[a-z]+:)?\/\//i;

export function assetPath(path: string): string {
  if (EXTERNAL_URL.test(path) || path.startsWith("data:") || path.startsWith("blob:")) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}

export function responsiveImageSrcSet(path: string): string {
  const normalized = path.replace(/^\/+/, "");
  const filename = normalized.split("/").pop() ?? normalized;
  const stem = filename.replace(/\.webp$/i, "");
  const variants = [600, 900, 1200, 2400].map(
    (width) => `${assetPath(`assets/images/responsive/${stem}-w${width}.webp`)} ${width}w`,
  );
  return [...variants.slice(0, 3), `${assetPath(path)} 1600w`, variants[3]].join(", ");
}
