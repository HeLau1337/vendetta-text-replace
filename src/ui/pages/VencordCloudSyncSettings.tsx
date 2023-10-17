/*
 * Parts of the source code in this file are taken from Vencord repository: https://github.com/Vendicated/Vencord
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { stylesheet as StyleSheet } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { rawColors } from "@vendetta/ui";
import { Forms, General, Button } from "@vendetta/ui/components";
import { VencordCloudSyncSettings } from "../../def";
import { authorizeCloud } from "../../utils/cloud";
import { getCloudSettings } from "../../utils/settingsSync";

// Components
const { ScrollView } = General;
const { FormSection, FormInput, FormDivider, FormSwitchRow, FormRow } = Forms;

const styles = StyleSheet.createThemedStyleSheet({
	dangerButton: {
		backgroundColor: rawColors.RED_400,
		marginHorizontal: 16
	},
	inputLabel: {
		marginTop: -40
	}
});

function getDefaultVencordCloudSyncSettings(): VencordCloudSyncSettings {
	return {
		authenticated: false,
		backendUrl: "https://api.vencord.dev/",
		syncVersion: 0,
		vencordCloudSecret: {}
	};
}

export default function VencordCloudSyncSettings() {
	if (storage.vencordCloudSyncSettings === undefined)
		storage.vencordCloudSyncSettings = getDefaultVencordCloudSyncSettings();

	useProxy(storage);

	return (
		<ScrollView>
			<FormSection>
				<FormSwitchRow
					label="Enable Cloud Integrations"
					value={storage.vencordCloudSyncSettings.authenticated}
					onValueChange={v => {
						v ? authorizeCloud() : storage.vencordCloudSyncSettings.authenticated = v;
					}}
					subLabel="This will request authorization if you have not yet set up cloud integrations."
				/>
			</FormSection>
			<FormSection>
				<FormDivider />
				<FormInput
					value={storage.vencordCloudSyncSettings.backendUrl}
					onChange={(v: string) => storage.vencordCloudSyncSettings.backendUrl = v}
					title="Backend URL"
				/>
				<FormRow
					subLabel="Which backend to use when using cloud integrations."
					style={styles.inputLabel}
				/>
			</FormSection>
			<FormSection>
				<FormDivider />
				<FormRow label="This will overwrite your local settings with the ones on the cloud. Use wisely!" />
				<Button
					style={styles.dangerButton}
					text={"Sync from Cloud"}
					disabled={!storage.vencordCloudSyncSettings.authenticated}
					onPress={() => {
						console.debug("'Sync from Cloud' pressed");
						getCloudSettings(true, true);
					}}
				>Sync from Cloud</Button>
			</FormSection>
		</ScrollView>
	);
};
