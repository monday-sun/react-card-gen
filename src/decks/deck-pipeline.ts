import { Observable, merge, mergeMap, shareReplay, tap } from 'rxjs';
import { Deck, OutputConfig } from '.';
import { Card, Cards } from '../cards';
import { File } from '../file/file';
import { FileContent } from '../file/file-content';
import { Layout, LayoutResult } from '../layout';
import { Output, OutputFilename } from '../output';
import { NeedsLayout, Templates } from '../templates';
import { Arguments } from '../types';



function templatesPipeline(
  args: Arguments,
  deck: Deck,
  cards$: Observable<Card[]>,
  endWatch$: Observable<boolean> | undefined,
) {
  return Templates.findFactory(args, deck).pipe(
    mergeMap((templatesFactory) =>
      templatesFactory(args, deck, cards$, (args, path) =>
        File.factory(args, path, endWatch$),
      ),
    ),
    tap(({ templatePaths, card }) =>
      console.log(
        'Requested layout for card:',
        card.name,
        'side:',
        card.frontTemplate === templatePaths.filePath ? 'front' : 'back',
      ),
    ),
    shareReplay(),
  );
}

function layoutPipeline(
  args: Arguments,
  deck: Deck,
  needsLayout$: Observable<NeedsLayout>,
) {
  return Layout.findFactory(args, deck).pipe(
    mergeMap((layoutFactory) => layoutFactory(args, deck, needsLayout$)),
    tap(({ templatePaths, card }) =>
      console.log(
        'Generated layout for card:',
        card.name,
        'side:',
        card.frontTemplate === templatePaths.filePath ? 'front' : 'back',
      ),
    ),
    shareReplay(),
  );
}

function outputPipeline(
  args: Arguments,
  outputConfig: OutputConfig,
  layout$: Observable<LayoutResult>,
) {
  return Output.findFactory(outputConfig).pipe(
    mergeMap((outputFactory) => outputFactory(args, outputConfig, layout$)),
    tap((outputPath) => console.log(`Generated output ${outputPath}`)),
  );
}

export function deckPipeline(
  args: Arguments,
  deck: Deck,
  endWatch$?: Observable<boolean>,
) {
  const cards$ = Cards.pipeline(args, deck, endWatch$);
  const templates$ = templatesPipeline(args, deck, cards$, endWatch$);
  const layout$ = layoutPipeline(args, deck, templates$);

  const outputPipelines: Observable<OutputFilename[]>[] = [];
  deck.output.forEach((outputConfig) => {
    outputPipelines.push(outputPipeline(args, outputConfig, layout$));
  });

  return merge(...outputPipelines);
}