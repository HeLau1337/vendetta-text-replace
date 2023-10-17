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


import { inflateSync } from "fflate";
import { getCloudAuth, getCloudUrl } from "./cloud";
import { storage } from "@vendetta/plugin";
import { Rule, VencordTextReplaceRules } from "../def";
import { showToast } from "@vendetta/ui/toasts";

function truncate(string: string, limit: number) {
	if (string.length > limit) {
		return string.slice(0, limit) + "...";
	}
	return string;
}

function convertToVendettaTextReplaceRules(vencordRules: VencordTextReplaceRules): Rule[] {
	const STRING_RULES_KEY = "TextReplace_rulesString";
	const REGEX_RULES_KEY = "TextReplace_rulesRegex";
    const TRUNC_LIMIT = 20;
	let vendettaRules: Rule[] = [];

	vencordRules[STRING_RULES_KEY].forEach(vencordRule => {
        if (vencordRule.find !== "" && vencordRule.replace !== "") {
            vendettaRules.push({
                name: truncate(vencordRule.find, TRUNC_LIMIT) + " → " + truncate(vencordRule.replace, TRUNC_LIMIT),
                match: vencordRule.find,
                flags: "",
                replace: vencordRule.replace,
                regex: false
            });
        }
	});
	vencordRules[REGEX_RULES_KEY].forEach(vencordRule => {
		const regExpFlags = /(\/([a-z]+)(?<!\\\/[a-z]+))$/;
		const match = vencordRule["find"].match(regExpFlags);
		let flags = "";
        let find = vencordRule.find;
		if (match) {
			flags = match[1];
            find = vencordRule["find"].split(flags)[0]; // remove the flags from the find-string (including fwd slash)
            flags = flags.split("/")[1]; // remove the fwd slash from the flags string
		}

        /* If the "g" (global search) flag is not part of the imported Vencord flags,
           add it to the Vendetta flags per default because the flag is also hard-coded into Vencord's TextReplace per default. */
        if (!flags.split("").includes("g")) {
            flags = flags + "g";
        }
        flags = flags.split("").sort().join("");

        if (vencordRule.find !== "" && vencordRule.replace !== "") {
            vendettaRules.push({
                name: truncate(vencordRule.find, TRUNC_LIMIT) + " → " + truncate(vencordRule.replace, TRUNC_LIMIT),
                match: find,
                flags: flags,
                replace: vencordRule.replace,
                regex: true
            });
        }
	});

	return vendettaRules;
}

export function importVencordTextReplaceRules(data: string) {
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
				storage.rules = convertToVendettaTextReplaceRules(importedRules);
			} else {
				throw new Error("There are no TextReplace rules stored in the Vencord Cloud Settings of this user account.");
			}
		} else {
			throw new Error("TextReplace could not be found in the Vencord Cloud Settings.");
		}
    } else {
        throw new Error("Invalid Settings. Is this even a Vencord Settings file?");
    }
}

export async function getCloudSettings(shouldNotify = true, force = false) {
    try {
        const res = await fetch(new URL("/v1/settings", getCloudUrl()), {
            method: "GET",
            headers: new Headers({
                Authorization: await getCloudAuth(),
                Accept: "application/octet-stream",
                "If-None-Match": force ? "" : storage.vencordCloudSyncSettings.syncVersion.toString()
            }),
        });

        if (res.status === 404) {
            console.info("No settings on the cloud");
            if (shouldNotify)
                showToast("Cloud Settings: There are no settings in the cloud.");
            return false;
        }

        if (res.status === 304) {
            console.info("Settings up to date");
            if (shouldNotify)
                showToast("Cloud Settings: Your settings are up to date.");
            return false;
        }

        if (!res.ok) {
            console.error(`Failed to sync down, API returned ${res.status}`);
            showToast(`Cloud Settings: Could not synchronize settings from the cloud (API returned ${res.status}).`);
            return false;
        }

        const written = Number(res.headers.get("etag")!);
        const localWritten = storage.vencordCloudSyncSettings.syncVersion;

        // don't need to check for written > localWritten because the server will return 304 due to if-none-match
        if (!force && written < localWritten) {
            if (shouldNotify)
                showToast("Cloud Settings: Your local settings are newer than the cloud ones.");
            return;
        }

        const data = await res.arrayBuffer();

        const settings = new TextDecoder().decode(inflateSync(new Uint8Array(data)));
        importVencordTextReplaceRules(settings);

        // sync with server timestamp instead of local one
        storage.vencordCloudSyncSettings.syncVersion = written;

        console.info("Settings loaded from cloud successfully");
        if (shouldNotify)
            showToast("Cloud Settings: Your settings have been updated!");

        return true;
    } catch (e: any) {
        console.error("Failed to sync down", e);
        showToast(`Cloud Settings: Could not synchronize settings from the cloud (${e.toString()}).`);
        return false;
    }
}

export async function deleteCloudSettings() {
    try {
        const res = await fetch(new URL("/v1/settings", getCloudUrl()), {
            method: "DELETE",
            headers: new Headers({
                Authorization: await getCloudAuth()
            }),
        });

        if (!res.ok) {
            console.error(`Failed to delete, API returned ${res.status}`);
            showToast(`Cloud Settings: Could not delete settings (API returned ${res.status}).`);
            return;
        }

        console.info("Settings deleted from cloud successfully");
        showToast("Cloud Settings: Settings deleted from cloud!");
    } catch (e: any) {
        console.error("Failed to delete", e);
        showToast(`Cloud Settings: Could not delete settings (${e.toString()}).`);
    }
}
