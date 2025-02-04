// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { app } from 'electron';
import { main } from './main/main';

app.whenReady().then(main);

app.on('window-all-closed', function () {
  app.quit();
});
