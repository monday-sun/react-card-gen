import { execFile } from 'child_process';
import * as util from 'util';

const exec = util.promisify(execFile);

describe('react-render', () => {
  it.each([
    {
      file: './test/test-component',
      data: { message: 'Hello!' },
    },
    {
      file: './test/test-component',
      data: { message: 'Goodbye!' },
    },
    {
      file: './does-not-exist-component',
      data: {},
    },
  ])('should load %p', ({ file, data }, done: jest.DoneCallback) => {
    const fakeSubject = exec('ts-node', [
      './src/layout/react/react-render/test/fake-react-render',
      file,
      JSON.stringify(data),
    ]);
    const testSubject = exec('ts-node', [
      './src/layout/react/react-render/react-render',
      file,
      JSON.stringify(data),
    ]);

    fakeSubject
      .then((expectedResult) => {
        testSubject
          .then((result) => {
            expect(result.stdout).toEqual(expectedResult.stdout);
            expect(result.stderr).toEqual(expectedResult.stderr);
            done();
          })
          .catch((error) => {
            // Error should not be thrown if it wasn't expected
            expect(error).toBeFalsy();
            done();
          });
      })
      .catch((expectedError: Error) => {
        testSubject.catch((error: Error) => {
          const afterError = expectedError.message.split('Error: ').pop();
          const errorMessage = afterError?.split(`\n`)[0];
          expect(errorMessage).toBeTruthy();
          expect(error.message).toEqual(
            expect.stringContaining(errorMessage as string),
          );
          done();
        });
      });
  });
});
