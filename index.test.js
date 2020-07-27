// @flow
'use strict';

import index from '.';

test('initial test to allow jest to succeed in CI', () => {
  return expect(index).toEqual({});
});
