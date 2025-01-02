import { SearchQueryFieldType } from "../type/SearchQueryFieldType";

export const convertSearchQueryToString = (
  param: SearchQueryFieldType
): string => {
  const parts: string[] = [];
  if (param.keyword) parts.push(param.keyword);
  if (param.track) parts.push(`track:${param.track}`);
  if (param.artist) parts.push(`artist:${param.artist}`);
  if (param.album) parts.push(`album:${param.album}`);
  if (param.genre) parts.push(`genre:${param.genre}`);
  if (param.year) parts.push(`year:${param.year}`);
  if (param.popularity) parts.push(`year:${param.popularity}`);
  return parts.join(" ");
};
