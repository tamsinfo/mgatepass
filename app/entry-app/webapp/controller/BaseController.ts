import Controller from "sap/ui/core/mvc/Controller";
import type ResourceModel from "sap/ui/model/resource/ResourceModel";
import type ResourceBundle from "sap/base/i18n/ResourceBundle";

/**
 * @namespace mgatepass.entry.controller
 */
export default class BaseController extends Controller {

	public getResourceText(sKey: string, aArgs?: string[]): string {
		const oModel = this.getOwnerComponent()!.getModel("i18n") as ResourceModel;
		const oBundle = oModel.getResourceBundle() as ResourceBundle;
		return oBundle.getText(sKey, aArgs) ?? sKey;
	}
}
