import UIComponent from "sap/ui/core/UIComponent";
import Device from "sap/ui/Device";

import models from "mgatepass/exit/model/models";

/**
 * @namespace mgatepass.exit
 */
export default class Component extends UIComponent {
	public static metadata = {
		manifest: "json",
		interfaces: ["sap.ui.core.IAsyncContentCreation"],
	};

	private contentDensityClass: string = "";

	public override init(): void {
		super.init();

		this.setModel(models.createDeviceModel(), "device");
	}

	public getContentDensityClass(): string {
		if (this.contentDensityClass !== "") return this.contentDensityClass;

		if (
			document.body.classList.contains("sapUiSizeCozy") ||
			Device.support.touch
		) {
			this.contentDensityClass = "sapUISizeCozy";
		} else if (
			document.body.classList.contains("sapUiSizeCompact") ||
			!Device.support.touch
		) {
			this.contentDensityClass = "sapUISizeCompact";
		}

		return this.contentDensityClass;
	}
}
