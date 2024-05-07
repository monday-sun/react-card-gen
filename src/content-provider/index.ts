import { Observable } from 'rxjs';

export interface FileContent {
  content(): Observable<string>;
}

type ContentProviderTypes = { watch: string; noWatch: string };

const contentProviderTypes: ContentProviderTypes = {
  watch: './watch-content/watch-content',
  noWatch: './no-watch-content/no-watch-content',
};

export const findContentProvider = (
  type: keyof ContentProviderTypes | string,
): Promise<(filePath: string) => FileContent> => {
  return (
    type in contentProviderTypes
      ? import(contentProviderTypes[type as keyof ContentProviderTypes])
      : import(type)
  ).then(({ createContentProvider }) => createContentProvider);
};
