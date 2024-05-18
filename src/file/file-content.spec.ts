import fsPromises from 'fs/promises';
import { of, throwError } from 'rxjs';
import { Arguments } from '../types';
import { FileContent } from './file-content';

jest.mock('fs/promises');

describe('FileContent', () => {
  it('reads when file change is observed', (done) => {
    const mockReadFile = fsPromises.readFile as jest.Mock;
    mockReadFile.mockResolvedValueOnce('file content');

    const fileContent$ = FileContent.factory(
      <Arguments>{},
      of({ filePath: 'file1', relativePath: 'rel/file1' }),
    );
    fileContent$.subscribe((content) => {
      expect(mockReadFile).toHaveBeenCalledWith('rel/file1', 'utf8');
      expect(content).toEqual({ filePath: 'file1', content: 'file content' });
      done();
    });
  });

  it('reads when file change is observed', (done) => {
    const fileContent$ = FileContent.factory(
      <Arguments>{},
      throwError(() => 'test error'),
    );

    fileContent$.subscribe({
      error: (error) => {
        expect(error).toEqual('test error');
        done();
      },
    });
  });
});
