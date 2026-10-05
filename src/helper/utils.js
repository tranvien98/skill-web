import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { filesize } from "filesize";
import dayjs from "dayjs";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes) {
  return filesize(bytes || 0, { base: 2, standard: "jedec", round: 1 });
}

export function formatTime(value) {
  return value ? dayjs(value).format("HH:mm DD/MM/YYYY") : "—";
}

export function basename(path) {
  return path.split("/").pop();
}

export function dirname(path) {
  const index = path.lastIndexOf("/");
  return index < 0 ? "" : path.slice(0, index);
}

export function extOf(path) {
  const name = basename(path);
  const index = name.lastIndexOf(".");
  return index <= 0 ? "" : name.slice(index).toLowerCase();
}
