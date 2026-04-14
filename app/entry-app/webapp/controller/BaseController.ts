import Controller from "sap/ui/core/mvc/Controller";
import type ResourceModel from "sap/ui/model/resource/ResourceModel";
import type ResourceBundle from "sap/base/i18n/ResourceBundle";

/**
 * @namespace mgatepass.entry.controller
 */
export default class BaseController extends Controller {

	private _bundle: ResourceBundle | null = null;

	protected async initResourceBundle(): Promise<void> {
		const oModel = this.getOwnerComponent()!.getModel("i18n") as ResourceModel;
		const result = oModel.getResourceBundle();
		this._bundle = result instanceof Promise ? await result : result;
	}

	public getResourceText(sKey: string, aArgs?: string[]): string {
		if (!this._bundle) return sKey;
		return this._bundle.getText(sKey, aArgs) ?? sKey;
	}
}
