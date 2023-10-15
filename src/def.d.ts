export interface Rule {
	name: string;
	match: string;
	flags: string;
	replace: string;
	regex: boolean;
}

export interface VencordCloudSyncSettings {
	authenticated: boolean;
	backendUrl: string;
	syncVersion: number;
	vencordCloudSecret: any;
}

export type VencordTextReplaceRule = Record<"find" | "replace" | "onlyIfIncludes", string>;

export interface VencordTextReplaceRules {
	TextReplace_rulesString: VencordTextReplaceRule[];
    TextReplace_rulesRegex: VencordTextReplaceRule[];
}
