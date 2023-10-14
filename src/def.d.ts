export interface Rule {
	name: string;
	match: string;
	flags: string;
	replace: string;
	regex: boolean;
}

export interface VencordCloudSyncSettings {
	vencordSyncEnabled: boolean;
	authenticated: boolean;
	backendUrl: string;
}
