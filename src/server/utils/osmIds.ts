import Hashids from "hashids";

const alphabet = "abcdefghjkmnopqrstuvwxyz0123456789";

export function encodeOsmId(osmId: number): string {
  const salt = osmId < 0 ? "r" : "w";
  const hashids = new Hashids(salt, 0, alphabet);
  return salt + hashids.encode(Math.abs(osmId));
}

export function decodeOsmId(hash: string): number {
  const cleanedHash = hash.slice(1);
  const salt = hash.charAt(0);
  const signFactor = salt === "r" ? -1 : 1;
  const hashids = new Hashids(salt, 0, alphabet);
  return Number(hashids.decode(cleanedHash)[0]) * signFactor;
}
