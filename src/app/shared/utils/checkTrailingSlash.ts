

export function checkTrailingSlash(url: string, addSlash: boolean = true): string {

  let allSlashesRemoved = false;
  let i = url.length - 1;
  while (!allSlashesRemoved && (i >= 0)) {
    if (url.charAt(i) != '/') {
        allSlashesRemoved = true;
        break;
    }

    url = url.substring(0, i);
    i--;
  }

  if (addSlash) {
    return url + "/";
  }

  return url;
}

