/*
 * Parts of the source code in this file are taken from Vencord repository: https://github.com/Vendicated/Vencord
 * Copyright (c) 2023 Vendicated and contributors
*/

import { stylesheet as StyleSheet, NavigationNative } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { rawColors } from "@vendetta/ui";
import { Forms, General } from "@vendetta/ui/components";
import { Rule, VencordCloudSyncSettings, VencordTextReplaceRules, VencordTextReplaceRule } from "../../def";
import { showToast } from "@vendetta/ui/toasts";

// Components
const { ScrollView, Button } = General;
const { FormSection, FormInput, FormDivider, FormSwitchRow, FormRow, FormLabel } = Forms;

const styles = StyleSheet.createThemedStyleSheet({
	delete: {
		color: rawColors.RED_400
	}
});

function truncate(string: string, limit: number) {
	if (string.length > limit) {
		return string.slice(0, limit) + "...";
	}
	return string;
}

function convertToVendettaTextReplaceRules(vencordRules: VencordTextReplaceRules): Rule[] {
	const STRING_RULES_KEY = "TextReplace_rulesString";
	const REGEX_RULES_KEY = "TextReplace_rulesRegex";
	let vendettaRules: Rule[];

	vencordRules[STRING_RULES_KEY].forEach(vencordRule => {
		vendettaRules.push({
			name: truncate(vencordRule.find, 10) + " → " + truncate(vencordRule.replace, 10),
			match: vencordRule.find,
			flags: "",
			replace: vencordRule.replace,
			regex: false
		})
	});
	vencordRules[REGEX_RULES_KEY].forEach(vencordRule => {
		const regExpFlags = /^(.*)\/([a-z]+)$/;
		const match = vencordRule["find"].match(regExpFlags);
		let flags = "";
		if (match) {
			flags = match[2];
		}
		vendettaRules.push({
			name: truncate(vencordRule.find, 10) + " → " + truncate(vencordRule.replace, 10),
			match: vencordRule.find,
			flags: flags,
			replace: vencordRule.replace,
			regex: true
		})
	});
	return vendettaRules;
}

export async function importVencordTextReplaceRules(data: string) {
	let vendettaRules = storage.rules as Rule[];
	useProxy(storage);

    try {
        var parsed = JSON.parse(data);
    } catch (err) {
        console.log(data);
        throw new Error("Failed to parse JSON: " + String(err));
    }

	let importedRules: VencordTextReplaceRules;

    if ("settings" in parsed && "quickCss" in parsed) {
		if ("plugins" in parsed.settings && "TextReplace" in parsed.settings.plugins) {
			if ("rules" in parsed.settings.plugins.TextReplace) {
				importedRules = parsed.settings.plugins.TextReplace.rules;
				vendettaRules = convertToVendettaTextReplaceRules(importedRules);
			} else {
				throw new Error("There are no TextReplace rules stored in the Vencord Cloud Settings of this user account.");
			}
		} else {
			throw new Error("TextReplace could not be found in the Vencord Cloud Settings.");
		}
    } else
        throw new Error("Invalid Settings. Is this even a Vencord Settings file?");
}

function getDefaultVencordCloudSyncSettings(): VencordCloudSyncSettings {
	return {
		vencordSyncEnabled: false,
		authenticated: false,
		backendUrl: "https://api.vencord.dev/",
	};
}

export default function VencordCloudSyncSettings() {
	let syncSettings: VencordCloudSyncSettings = storage.vencordCloudSyncSettings ?? getDefaultVencordCloudSyncSettings();
	useProxy(storage);

	const navigation = NavigationNative.useNavigation();

	return (
		<ScrollView>
			<FormSection>
				<FormSwitchRow
					label="Enable Cloud Integrations"
					subLabel="This will request authorization if you have not yet set up cloud integrations."
					value={syncSettings.vencordSyncEnabled}
					onValueChange={(v: boolean) => syncSettings.vencordSyncEnabled = v}
				/>
			</FormSection>
			<FormSection>
				<FormInput
					value={syncSettings.backendUrl}
					onChange={(v: string) => syncSettings.backendUrl = v}
					title="Backend URL"
				/>
			</FormSection>
			<FormSection>
				<FormDivider />
				<FormRow label="This will overwrite your local settings with the ones on the cloud. Use wisely!"/>
				<Button
					title="Sync from Cloud"
					sublabel="This will overwrite your local settings with the ones on the cloud. Use wisely!"
					disabled={!syncSettings.authenticated}
					onPress={() => {showToast("Sync from Cloud was pressed but nothing happened yet.")}}
				>Sync from Cloud</Button>
			</FormSection>
		</ScrollView>
	);
};
