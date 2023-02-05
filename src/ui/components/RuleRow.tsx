import { findByDisplayName, findByProps } from "@vendetta/metro";
import { constants as Constants, NavigationNative } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms, General } from "@vendetta/ui/components";
import EditRule from "../pages/EditRule";

// Components
const { View, Pressable } = General;
const { FormRow, FormArrow } = Forms;
const { Swipeable } = findByProps("Swipeable");
const { default: Icon } = findByDisplayName("Icon", false);

const Trash = getAssetIDByName("ic_trash_24px");

export default function RuleRow({ rule, index }) {
	const navigation = NavigationNative.useNavigation();

	function RuleRowRightActions() {
		const deleteRuleCallback = () => {
			storage.rules.splice(index, 1);
		};

		return (
			<Pressable onPress={deleteRuleCallback}>
				<View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
					<Icon source={Trash} color={Constants.Colors.STATUS_RED} />
				</View>
			</Pressable>
		);
	};

	return (
		<Swipeable renderRightActions={RuleRowRightActions}>
			<FormRow
				label={rule.name}
				trailing={<FormArrow />}
				onPress={() => navigation.push("VendettaCustomPage", {
					title: "Editing Rule",
					render: () => <EditRule ruleIndex={index} />
				})}
			/>
		</Swipeable>
	);
};
