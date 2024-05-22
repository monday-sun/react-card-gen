import path from 'path';
import {
  Observable,
  catchError,
  combineLatest,
  from,
  map,
  mergeMap,
  of,
} from 'rxjs';
import { LayoutFactory, LayoutResult } from '..';
import { Deck } from '../../decks';
import { NeedsLayout } from '../../templates';
import { Arguments } from '../../types';
import { ReactRender } from './react-render';

function executeInThisProcess(
  templatePath: string,
  data: Record<string, string>,
  renderPath: string,
): Observable<string> {
  return from(import('./react-render/' + renderPath)).pipe(
    map(({ render }) => render as ReactRender),
    mergeMap((render) => render(templatePath, data)),
  );
}

function executeInChildProcess(
  templatePath: string,
  data: Record<string, string>,
  renderPath: string,
): Observable<string> {
  return from(import('child_process')).pipe(
    map(({ execFileSync }) =>
      execFileSync('ts-node', [
        path.join(__dirname, 'react-render', renderPath),
        templatePath,
        JSON.stringify(data),
      ]),
    ),
    map((buffer) => buffer.toString()),
  );
}

function toHTML(
  templatePath: string,
  data: Record<string, string>,
  process: 'this' | 'child',
  renderPath: string,
): Observable<string> {
  const layoutPipeline =
    process === 'this'
      ? executeInThisProcess(templatePath, data, renderPath)
      : executeInChildProcess(templatePath, data, renderPath);
  return layoutPipeline.pipe(
    catchError((error) => {
      console.error('Error rendering React layout', error);
      return of('');
    }),
  );
}

export const factory: LayoutFactory = (
  args: Arguments,
  _: Deck,
  templates$: Observable<NeedsLayout>,
  reactRenderPath: string = 'react-render',
): Observable<LayoutResult> => {
  return templates$.pipe(
    mergeMap((needsLayout) =>
      combineLatest([
        of(needsLayout),
        toHTML(
          needsLayout.templatePaths.relativePath,
          needsLayout.card,
          args.watch ? 'child' : 'this',
          reactRenderPath,
        ),
      ]),
    ),
    map(([{ templatePaths, card }, layout]) => ({
      templatePaths,
      card,
      layout,
      format: 'html',
    })),
  );
};
