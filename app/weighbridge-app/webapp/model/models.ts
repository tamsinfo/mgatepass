import BindingMode from "sap/ui/model/BindingMode";
import JSONModel from "sap/ui/model/json/JSONModel";

import Device from "sap/ui/Device";

export default {
	createDeviceModel: () => {
		const deviceModel = new JSONModel(Device);

		deviceModel.setDefaultBindingMode(BindingMode.TwoWay);

		return deviceModel;
	},
};
