/*
 * Parts of the source code in this file are taken from Vencord repository: https://github.com/Vendicated/Vencord
 * Copyright (c) 2023 Vendicated and contributors
*/

import { stylesheet as StyleSheet, NavigationNative } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { rawColors } from "@vendetta/ui";
import { Forms, General } from "@vendetta/ui/components";
import { VencordCloudSyncSettings } from "../../def";
import { showToast } from "@vendetta/ui/toasts";

// Components
const { ScrollView } = General;
const { FormSection, FormInput, Button, FormDivider, FormSwitchRow, FormRow, FormLabel } = Forms;

const styles = StyleSheet.createThemedStyleSheet({
	delete: {
		color: rawColors.RED_400
	}
})

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
				<Button
					sublabel="This will overwrite your local settings with the ones on the cloud. Use wisely!"
					size={Button.Sizes.SMALL}
					color={Button.Colors.RED}
					disabled={!syncSettings.authenticated}
					onClick={() => showToast("Sync from Cloud was pressed but nothing happened yet.")}
				>Sync from Cloud</Button>
			</FormSection>
		</ScrollView>
	);
};
