// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Resources } from '../../../shared/shared-types';
import {
  canHaveChildren,
  isIdOfResourceWithChildren,
} from '../can-have-children';

describe('canHaveChildren', () => {
  test('returns true for a folder', () => {
    const testResources: Resources = {};

    expect(canHaveChildren(testResources)).toBe(true);
  });

  test('returns false for a file', () => {
    const testFileFromResources = 1;

    expect(canHaveChildren(testFileFromResources)).toBe(false);
  });
});

describe('isIdOfResourceWithChildren', () => {
  test('returns true for a folder id', () => {
    const testFolderPath = '/some_folder/';

    expect(isIdOfResourceWithChildren(testFolderPath)).toBe(true);
  });

  test('returns false for a file id', () => {
    const testFilePath = '/some_folder/some_file';

    expect(isIdOfResourceWithChildren(testFilePath)).toBe(false);
  });
});
