/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IChannel, IServerChannel } from 'vs/base/parts/ipc/node/ipc';
import { IWorkspacesService, IWorkspaceIdentifier, IWorkspaceFolderCreationData, IWorkspacesMainService, reviveWorkspaceIdentifier } from 'vs/platform/workspaces/common/workspaces';
import { URI } from 'vs/base/common/uri';
import { Event } from 'vs/base/common/event';

export class WorkspacesChannel implements IServerChannel {

	constructor(private service: IWorkspacesMainService) { }

	listen<T>(_, event: string): Event<T> {
		throw new Error(`Event not found: ${event}`);
	}

	call(_, command: string, arg?: any): Promise<any> {
		switch (command) {
			case 'createUntitledWorkspace': {
				const rawFolders: IWorkspaceFolderCreationData[] = arg[0];
				const remoteAuthority: string = arg[1];
				let folders: IWorkspaceFolderCreationData[] | undefined = undefined;
				if (Array.isArray(rawFolders)) {
					folders = rawFolders.map(rawFolder => {
						return {
							uri: URI.revive(rawFolder.uri), // convert raw URI back to real URI
							name: rawFolder.name
						} as IWorkspaceFolderCreationData;
					});
				}

				return this.service.createUntitledWorkspace(folders, remoteAuthority);
			}
			case 'deleteUntitledWorkspace': {
				const w: IWorkspaceIdentifier = arg;
				return this.service.deleteUntitledWorkspace({ id: w.id, configPath: URI.revive(w.configPath) });
			}
		}

		throw new Error(`Call not found: ${command}`);
	}
}

export class WorkspacesChannelClient implements IWorkspacesService {

	_serviceBrand: any;

	constructor(private channel: IChannel) { }

	createUntitledWorkspace(folders?: IWorkspaceFolderCreationData[], remoteAuthority?: string): Promise<IWorkspaceIdentifier> {
		return this.channel.call('createUntitledWorkspace', [folders, remoteAuthority]).then(reviveWorkspaceIdentifier);
	}

	deleteUntitledWorkspace(workspaceIdentifier: IWorkspaceIdentifier): Promise<void> {
		return this.channel.call('deleteUntitledWorkspace', workspaceIdentifier);
	}
}
