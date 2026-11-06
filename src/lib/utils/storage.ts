
export function getStorage(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setStorage(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch (error) {
    console.log(error)
  }
}

export function removeStorage(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch(error) {
   console.log(error)
  }
}
