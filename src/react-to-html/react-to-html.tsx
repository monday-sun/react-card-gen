import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export async function convertToStaticHtml(
  componentPath: string,
  props: Record<string, any> = {},
): Promise<string> {
  const { default: Component } = await import(componentPath);
  return renderToStaticMarkup(<Component {...props} />);
}
