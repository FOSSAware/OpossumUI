// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ResourcesWithAttributedChildren } from '../../shared/shared-types';

export function getAttributedChildren(
  resourcesWithAttributedChildren: ResourcesWithAttributedChildren,
  resourceId: string
): Set<string> {
  return resourcesWithAttributedChildren &&
    resourceId in resourcesWithAttributedChildren
    ? resourcesWithAttributedChildren[resourceId]
    : new Set();
}
