// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import clsx from 'clsx';
import React, { ReactElement } from 'react';
import { Resources } from '../../../shared/shared-types';
import { PathPredicate } from '../../types/types';
import {
  canHaveChildren,
  isIdOfResourceWithChildren,
} from '../../util/can-have-children';
import { ClosedFolderIcon, OpenFolderIcon } from '../Icons/Icons';

export function renderTree(
  resources: Resources,
  path: string,
  classes: Record<
    | 'treeItemLabel'
    | 'treeItemLabelChildrenOfSelected'
    | 'treeItemLabelSelected'
    | 'listItem'
    | 'treeItemSpacer',
    string
  >,
  expandedNodes: Array<string>,
  selected: string,
  isFileWithChildren: PathPredicate,
  onSelect: (event: React.ChangeEvent<unknown>, nodeId: string) => void,
  onToggle: (nodeIdsToExpand: Array<string>) => void,
  getTreeItemLabel: (
    resourceName: string,
    resource: Resources | 1,
    nodeId: string
  ) => ReactElement
): Array<ReactElement> {
  const sortedResourceNames: Array<string> = Object.keys(resources).sort(
    getSortFunction(resources, isFileWithChildren, path)
  );

  let treeItems: Array<ReactElement> = [];

  for (const resourceName of sortedResourceNames) {
    const resource = resources[resourceName];
    const isAFolder = canHaveChildren(resource);
    const nodeId = getNodeId(resourceName, path, isAFolder);
    const isExpandedFolder = isExpanded(nodeId, expandedNodes);
    const indentPerDepthLevel = 12;
    const fileExtraIndent = 28;
    const marginRight =
      ((nodeId.match(/\//g) || []).length - 1) * indentPerDepthLevel +
      (!isAFolder ? fileExtraIndent : 0);

    const nodeIdsToExpand: Array<string> = getNodeIdsToExpand(nodeId, resource);

    function onFolderClick(event: React.ChangeEvent<unknown>): void {
      if (!isExpandedFolder) {
        onToggle(nodeIdsToExpand);
      }
      onSelect(event, nodeId);
    }

    function onFileClick(event: React.ChangeEvent<unknown>): void {
      onSelect(event, nodeId);
    }

    treeItems.push(
      <div className={classes.listItem}>
        <div
          className={classes.treeItemSpacer}
          style={{ width: marginRight }}
        />
        {isAFolder
          ? getFolderIcon(isExpandedFolder, nodeId, nodeIdsToExpand, onToggle)
          : null}
        <div
          className={clsx(
            classes.treeItemLabel,
            isSelected(nodeId, selected)
              ? classes.treeItemLabelSelected
              : isChildOfSelected(nodeId, selected)
              ? classes.treeItemLabelChildrenOfSelected
              : null
          )}
          onClick={isAFolder ? onFolderClick : onFileClick}
        >
          {getTreeItemLabel(resourceName, resource, nodeId)}
        </div>
      </div>
    );

    if (isExpandedFolder) {
      treeItems = treeItems.concat(
        renderTree(
          resource as Resources,
          nodeId,
          classes,
          expandedNodes,
          selected,
          isFileWithChildren,
          onSelect,
          onToggle,
          getTreeItemLabel
        )
      );
    }
  }

  return treeItems;
}

export function getNodeIdsToExpand(
  nodeId: string,
  resource: Resources | 1
): Array<string> {
  const nodeIdsToExpand: Array<string> = [nodeId];
  addNodeIdsToExpand(nodeIdsToExpand, resource);
  return nodeIdsToExpand;
}

function addNodeIdsToExpand(
  nodeIdsToExpand: Array<string>,
  resource: Resources | 1
): void {
  const containedNodes = Object.keys(resource);
  if (resource !== 1 && containsExactlyOneFolder(resource, containedNodes)) {
    nodeIdsToExpand.push(
      getNodeIdOfFirstContainedNode(containedNodes, nodeIdsToExpand, resource)
    );
    addNodeIdsToExpand(nodeIdsToExpand, resource[containedNodes[0]]);
  }
}

function containsExactlyOneFolder(
  resource: Resources,
  containedNodes: Array<string>
): boolean {
  return (
    containedNodes.length == 1 && canHaveChildren(resource[containedNodes[0]])
  );
}

function getNodeIdOfFirstContainedNode(
  containedNodes: Array<string>,
  nodeIdsToExpand: Array<string>,
  resource: Resources
): string {
  const latestNodeIdToExpand = nodeIdsToExpand[nodeIdsToExpand.length - 1];
  return getNodeId(
    containedNodes[0],
    latestNodeIdToExpand,
    canHaveChildren(resource[containedNodes[0]])
  );
}

function getFolderIcon(
  isExpandedFolder: boolean,
  nodeId: string,
  nodeIdsToExpand: Array<string>,
  onToggle: (nodeIdsToExpand: Array<string>) => void
): ReactElement {
  return isExpandedFolder ? (
    <OpenFolderIcon
      onClick={(): void => {
        onToggle(nodeIdsToExpand);
      }}
      label={nodeId}
    />
  ) : (
    <ClosedFolderIcon
      onClick={(): void => onToggle(nodeIdsToExpand)}
      label={nodeId}
    />
  );
}

function getNodeId(
  resourceName: string,
  path: string,
  isFolder: boolean
): string {
  return path + (isFolder ? resourceName + '/' : resourceName);
}

function isExpanded(nodeId: string, expandedNodes: Array<string>): boolean {
  if (!isIdOfResourceWithChildren(nodeId)) {
    return false;
  }

  for (const expandedNodeId of expandedNodes) {
    if (expandedNodeId === nodeId) {
      return true;
    }
  }

  return false;
}

function isSelected(nodeId: string, selected: string): boolean {
  return nodeId === selected;
}

export function isChildOfSelected(nodeId: string, selected: string): boolean {
  return (
    nodeId.startsWith(selected) &&
    !isSelected(nodeId, selected) &&
    selected.slice(-1) === '/'
  );
}

function getSortFunction(
  resources: Resources,
  isFileWithChildren: PathPredicate,
  path: string
) {
  return (left: string, right: string): number => {
    const leftResource = resources[left];
    const rightResource = resources[right];
    const leftIsFolderOrFileWithChildren = canHaveChildren(leftResource);
    const rightIsFolderOrFileWithChildren = canHaveChildren(rightResource);
    const leftNodeId = getNodeId(left, path, leftIsFolderOrFileWithChildren);
    const rightNodeId = getNodeId(right, path, rightIsFolderOrFileWithChildren);

    const leftResourceIsFolder =
      leftIsFolderOrFileWithChildren && !isFileWithChildren(leftNodeId);
    const rightResourceIsFolder =
      rightIsFolderOrFileWithChildren && !isFileWithChildren(rightNodeId);

    if (leftResourceIsFolder && !rightResourceIsFolder) {
      return -1;
    } else if (!leftResourceIsFolder && rightResourceIsFolder) {
      return 1;
    }
    return left.toLowerCase().localeCompare(right.toLowerCase());
  };
}
