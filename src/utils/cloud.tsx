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
import { findByName, findByProps, findByStoreName } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";
import { storage } from "@vendetta/plugin";

const UserStore = findByStoreName("UserStore");
const { pushModal, popModal } = findByProps("pushModal", "popModal");

export const getCloudUrl = () => new URL(storage.vencordCloudSyncSettings.backendUrl);


const cloudUrlOrigin = () => getCloudUrl().origin;
const getUserId = () => {
    const id = UserStore.getCurrentUser()?.id;
    if (!id) throw new Error("User not yet logged in");
    return id;
};

export async function getAuthorization() {
    const secrets = storage.vencordCloudSyncSettings.vencordCloudSecret ?? {};
    const origin = cloudUrlOrigin();

    return secrets[`${origin}:${getUserId()}`];
}

async function setAuthorization(secret: string) {
    const secrets = storage.vencordCloudSyncSettings.vencordCloudSecret ?? {};

    secrets[`${cloudUrlOrigin()}:${getUserId()}`] = secret;
    return secrets;
}

export async function deauthorizeCloud() {
    const secrets = storage.vencordCloudSyncSettings.vencordCloudSecret ?? {};
    delete secrets[`${cloudUrlOrigin()}:${getUserId()}`];
    return secrets;
}

export async function authorizeCloud() {
    if (await getAuthorization() !== undefined) {
        console.debug("authorizeCloud() | getAuthorization() returned value");
        storage.vencordCloudSyncSettings.authenticated = true;
        return;
    }

    try {
        const oauthConfiguration = await fetch(new URL("/v1/oauth/settings", getCloudUrl()));
        var { clientId, redirectUri } = await oauthConfiguration.json();
        console.debug("authorizeCloud() | clientId: ", clientId, " ; redirectUri: ", redirectUri);
    } catch(error) {
        console.error(error);
        showToast("Cloud Integration: Setup failed (couldn't retrieve OAuth configuration).");
        storage.vencordCloudSyncSettings.authenticated = false;
        return;
    }

    const OAuth2AuthorizeModal = findByName("OAuth2AuthorizeModal");

    pushModal({
        key: "oauth2-authorize",
        modal: {
            key: "oauth2-authorize",
            modal: OAuth2AuthorizeModal,
            animation: "slide-up",

            shouldPersistUnderModals: false,
            props: {
                clientId: clientId,
                redirectUri: redirectUri,
                scopes: ["identify"],
                responseType: "code",
                permissions: 0n,
                cancelCompletesFlow: false,
                callback: async ({ location }: any) => {
                    if (!location) {
                        console.debug("authorizeCloud() -> pushModal() -> callback | location is false/invalid");
                        storage.vencordCloudSyncSettings.authenticated = false;
                        return;
                    }

                    try {
                        const res = await fetch(location, {
                            headers: new Headers({ Accept: "application/json" })
                        });
                        const { secret } = await res.json();
                        if (secret) {
                            console.info("Authorized with secret");
                            await setAuthorization(secret);
                            showToast("Cloud Integration: Cloud integrations enabled!");
                            storage.vencordCloudSyncSettings.authenticated = true;
                        } else {
                            showToast("Cloud Integration: Setup failed (no secret returned?).");
                            storage.vencordCloudSyncSettings.authenticated = false;
                        }
                    } catch (e: any) {
                        console.error("Failed to authorize", e);
                        showToast(`Cloud Integration: Setup failed (${e.toString()}).`);
                        storage.vencordCloudSyncSettings.authenticated = false;
                    }
                },
                dismissOAuthModal: () => popModal("oauth2-authorize"),
            },
            closable: true,
        },
    });
}

export async function getCloudAuth() {
    const secret = await getAuthorization();

    return Buffer.from(`${secret}:${getUserId()}`).toString('base64');
}
