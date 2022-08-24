import HTTPError from 'http-errors';

function echo(value: string) {
  if (value === 'echo') {
    // ITERATION three
    throw HTTPError(400, 'Cannot echo "echo"');
    // ITERATION two
    // return { error: 'error' };
  }
  return value;
}

export { echo };
