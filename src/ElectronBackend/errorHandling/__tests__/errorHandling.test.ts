// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { dialog, WebContents } from 'electron';
import { SendErrorInformationArgs } from '../../../shared/shared-types';
import { loadJsonFromFilePath } from '../../input/importFromFile';
import {
  createListenerCallbackWithErrorHandling,
  getMessageBoxContentForErrorsWrapper,
  getMessageBoxContentForParsingError,
  getMessageBoxForErrors,
  getMessageBoxForParsingError,
} from '../errorHandling';
import { IpcChannel } from '../../../shared/ipc-channels';
import { JsonParsingError } from '../../types/types';

jest.mock('electron', () => ({
  dialog: {
    showMessageBox: jest.fn(() => {
      return Promise.resolve({
        response: 0,
      });
    }),
  },
}));

jest.mock('electron-log');

jest.mock('../../input/importFromFile', () => ({
  loadJsonFromFilePath: jest.fn(),
}));

describe('error handling', () => {
  describe('createListenerCallbackWithErrorHandling', () => {
    test('returns a wrapper that calls the input function with the same parameters', async () => {
      const testFunction = jest.fn();
      const testArgs = {
        arg1: '1',
        arg2: true,
      };

      const mockCallback = jest.fn();
      const webContents = { send: mockCallback as unknown } as WebContents;

      await createListenerCallbackWithErrorHandling(
        webContents,
        testFunction
      )(testArgs);
      expect(testFunction).toHaveBeenCalledTimes(1);
      expect(testFunction).toHaveBeenCalledWith(
        expect.objectContaining(testArgs)
      );
    });

    test('shows errors from the input function in a messageBox', async () => {
      function testFunction(): void {
        throw new Error('TEST_ERROR');
      }

      const mockCallback = jest.fn();
      const webContents = { send: mockCallback as unknown } as WebContents;

      await createListenerCallbackWithErrorHandling(
        webContents,
        testFunction
      )();

      expect(dialog.showMessageBox).toBeCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Error in app backend: TEST_ERROR',
          buttons: ['Reload File', 'Quit'],
        })
      );
    });
  });

  describe('getMessageBoxContentForErrors', () => {
    test('for backend errors', () => {
      const testError = new Error('TEST_ERROR');
      const messageBoxContentForBackendErrors =
        getMessageBoxContentForErrorsWrapper(
          true,
          testError.stack
        )(testError.message);
      expect(messageBoxContentForBackendErrors.detail).toContain(
        'Error: TEST_ERROR'
      );
      expect(messageBoxContentForBackendErrors.message).toEqual(
        'Error in app backend: TEST_ERROR'
      );
    });

    test('for frontend errors', () => {
      const testError = new Error('TEST_ERROR');
      const messageBoxContentForBackendErrors =
        getMessageBoxContentForErrorsWrapper(
          false,
          testError.stack
        )(testError.message);
      expect(messageBoxContentForBackendErrors.detail).toContain(
        'Error: TEST_ERROR'
      );
      expect(messageBoxContentForBackendErrors.message).toEqual(
        'Error in app frontend: TEST_ERROR'
      );
    });
  });

  describe('getMessageBoxForErrors', () => {
    test('returns a messageBox', async () => {
      const sendErrorInformationArgs: SendErrorInformationArgs = {
        error: { message: 'errorMessage', name: 'Error' },
        errorInfo: { componentStack: 'componentStack' },
      };
      const mockCallback = jest.fn();
      const webContents = { send: mockCallback as unknown } as WebContents;

      await getMessageBoxForErrors(
        sendErrorInformationArgs.error.message,
        sendErrorInformationArgs.errorInfo.componentStack,
        webContents,
        false
      );

      expect(dialog.showMessageBox).toBeCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Error in app frontend: errorMessage',
          detail: 'Stack trace: componentStack',
          buttons: ['Reload File', 'Quit'],
        })
      );
      expect(mockCallback.mock.calls.length).toBe(1);
      expect(mockCallback.mock.calls[0][0]).toContain(
        IpcChannel['RestoreFrontend']
      );
      expect(loadJsonFromFilePath).toBeCalled();
    });
  });

  describe('getMessageBoxContentForParsingErrors', () => {
    test('display an error message', () => {
      const testMessage = 'Test error message';
      const messageBoxContentForParsingErrors =
        getMessageBoxContentForParsingError(testMessage);
      expect(messageBoxContentForParsingErrors.detail).toContain(
        'Test error message'
      );
      expect(messageBoxContentForParsingErrors.message).toEqual(
        'Error parsing the input file.'
      );
    });
  });

  describe('getMessageBoxForParsingError', () => {
    test('returns a messageBox', async () => {
      const parsingError: JsonParsingError = {
        message: 'parsingErrorMessage',
        type: 'jsonParsingError',
      };
      const mockCallback = jest.fn();
      const webContents = { send: mockCallback as unknown } as WebContents;

      await getMessageBoxForParsingError(parsingError.message, webContents);

      expect(dialog.showMessageBox).toBeCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Error parsing the input file.',
          detail: 'parsingErrorMessage',
          buttons: ['Ok'],
        })
      );
      expect(mockCallback.mock.calls.length).toBe(1);
      expect(mockCallback.mock.calls[0][0]).toContain(
        IpcChannel['RestoreFrontend']
      );
      expect(loadJsonFromFilePath).toBeCalled();
    });
  });
});
