import BaseController from "mgatepass/config/controller/BaseController";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type Table from "sap/m/Table";
import type Button from "sap/m/Button";
import type FileUploader from "sap/ui/unified/FileUploader";
import type Event from "sap/ui/base/Event";

const GATEPASS_TYPE_LABELS: Record<string, string> = {
	Returnable: "Returnable",
	NonReturnable: "Non-Returnable",
	AgainstOutwardRGP: "Against Outward RGP",
	AgainstInwardRGP: "Against Inward RGP"
};

/**
 * @namespace mgatepass.config.controller
 */
export default class AppController extends BaseController {

	public onInit(): void {
		this.loadConfig();
	}

	private async loadConfig(): Promise<void> {
		const oModel = this.getOwnerComponent()!.getModel() as ODataModel;
		const oBinding = oModel.bindList("/AppConfig");
		const aContexts = await oBinding.requestContexts(0, 1);
		const sPath = aContexts[0]?.getPath();
		oBinding.destroy();

		if (!sPath) {
			MessageBox.error("No configuration found. Please contact an administrator.");
			return;
		}

		this.getView()!.bindElement({ path: sPath });
	}

	public formatGatepassType(sType: string): string {
		return GATEPASS_TYPE_LABELS[sType] ?? sType;
	}

	public onAddCarrier(): void {
		const oTable = this.byId("vehicleTypesTable") as Table;
		const oBinding = oTable.getBinding("items") as ODataListBinding;
		oBinding.create({
			name: "",
			requireTransporterName: true,
			requireDriverName: true,
			requireDriverContact: true,
			requireVehicleNumber: true,
			requireDriverLicense: true
		}, false, true);
	}

	public onDeleteCarrier(oEvent: Event): void {
		(oEvent.getSource() as Button).getBindingContext()!.delete();
	}

	public onAddGate(): void {
		const oTable = this.byId("gatesTable") as Table;
		const oBinding = oTable.getBinding("items") as ODataListBinding;
		oBinding.create({
			name: "",
			allowEntry: true,
			allowExit: true
		}, false, true);
	}

	public onDeleteGate(oEvent: Event): void {
		(oEvent.getSource() as Button).getBindingContext()!.delete();
	}

	public onLogoChange(): void {
		const oFileUploader = this.byId("logoUploader") as FileUploader;
		const oDomRef = oFileUploader.getFocusDomRef() as HTMLInputElement;

		if (!oDomRef?.files?.length) return;

		const oReader = new FileReader();
		oReader.onload = () => {
			this.getView()!.getBindingContext()?.setProperty("companyLogo", oReader.result as string);
		};
		oReader.readAsDataURL(oDomRef.files[0]);
	}

	public onLogoTypeMismatch(): void {
		MessageBox.error("Please upload a valid image file (PNG, JPG, SVG, or WebP).");
	}

	public async onSave(): Promise<void> {
		const oModel = this.getView()!.getModel() as ODataModel;
		try {
			await oModel.submitBatch("configUpdate");
			MessageToast.show("Configuration saved.");
		} catch {
			MessageBox.error("Failed to save configuration.");
		}
	}
}
