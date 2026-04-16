import BaseController from "mgatepass/approval/controller/BaseController";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import JSONModel from "sap/ui/model/json/JSONModel";
import Fragment from "sap/ui/core/Fragment";
import MDialog from "sap/m/Dialog";
import TextArea from "sap/m/TextArea";
import MButton from "sap/m/Button";
import VBox from "sap/m/VBox";
import Label from "sap/m/Label";
import type Dialog from "sap/m/Dialog";
import type Button from "sap/m/Button";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type Table from "sap/m/Table";
import type Event from "sap/ui/base/Event";

const GATEPASS_TYPE_LABELS: Record<string, string> = {
	Returnable: "Returnable",
	NonReturnable: "Non-Returnable",
	AgainstOutwardRGP: "Against Outward RGP",
	AgainstInwardRGP: "Against Inward RGP"
};

interface DetailData {
	passNumber: string;
	createdAt: string;
	createdBy: string;
	processType: string;
	gatepassTypeFormatted: string;
	documents: string;
	weighbridgeRequired: boolean;
	isReturnable: boolean;
	expectedReturnDate: string;
	carrierType: string;
	transporterName: string;
	driverName: string;
	driverContact: string;
	driverLicense: string;
	vehicleNumber: string;
	passPath: string;
}

/**
 * @namespace mgatepass.approval.controller
 */
export default class AppController extends BaseController {

	private _pDetailDialog: Promise<Dialog> | null = null;

	public override onInit(): void {
		this.initResourceBundle();
	}

	public formatDocuments(aDocuments: unknown): string {
		if (!aDocuments) return "";
		if (typeof aDocuments === "string") return aDocuments;
		if (Array.isArray(aDocuments)) {
			return aDocuments
				.map((d: unknown) => (typeof d === "object" && d !== null) ? (d as Record<string, unknown>).value : d)
				.filter(Boolean)
				.join(", ");
		}
		return String(aDocuments);
	}

	public onRefreshTable(): void {
		const oTable = this.byId("passesTable") as Table;
		const oBinding = oTable?.getBinding("items") as ODataListBinding;
		if (oBinding) oBinding.refresh();
	}

	private async getDetailDialog(): Promise<Dialog> {
		if (!this._pDetailDialog) {
			this._pDetailDialog = Fragment.load({
				id: this.getView()!.getId(),
				name: "mgatepass.approval.fragment.DetailDialog",
				controller: this
			}).then(oDialog => {
				this.getView()!.addDependent(oDialog as Dialog);
				return oDialog as Dialog;
			});
		}
		return this._pDetailDialog;
	}

	public async onViewDetails(oEvent: Event): Promise<void> {
		const oContext = (oEvent.getSource() as Button).getBindingContext()!;
		const oModel = this.getView()!.getModel() as ODataModel;
		const gatepassType = oContext.getProperty("gatepassType") as string;

		const detail: DetailData = {
			passNumber: oContext.getProperty("passNumber") as string,
			createdAt: oContext.getProperty("createdAt") as string,
			createdBy: oContext.getProperty("createdBy") as string,
			processType: oContext.getProperty("processType") as string,
			gatepassTypeFormatted: GATEPASS_TYPE_LABELS[gatepassType] ?? gatepassType,
			documents: this.formatDocuments(oContext.getProperty("documents")),
			weighbridgeRequired: oContext.getProperty("weighbridgeRequired") as boolean,
			isReturnable: gatepassType === "Returnable",
			expectedReturnDate: (oContext.getProperty("expectedReturnDate") as string) ?? "",
			carrierType: "",
			transporterName: "",
			driverName: "",
			driverContact: "",
			driverLicense: "",
			vehicleNumber: "",
			passPath: oContext.getPath()
		};

		const vehicleId = oContext.getProperty("vehicle_ID") as string | null;
		if (vehicleId) {
			const vBinding = oModel.bindContext(`/Vehicles('${vehicleId}')`);
			const vCtx = await vBinding.requestObject();
			if (vCtx) {
				const v = vCtx as Record<string, unknown>;
				detail.vehicleNumber = (v.vehicleNumber as string) ?? "";
				detail.transporterName = (v.transporter as string) ?? "";

				const typeId = v.type_ID as string | null;
				if (typeId) {
					const vtBinding = oModel.bindContext(`/VehicleTypes('${typeId}')`);
					const vtCtx = await vtBinding.requestObject();
					if (vtCtx) {
						detail.carrierType = ((vtCtx as Record<string, unknown>).name as string) ?? "";
					}
					vtBinding.destroy();
				}
			}
			vBinding.destroy();
		}

		const driverId = oContext.getProperty("driver_ID") as string | null;
		if (driverId) {
			const dBinding = oModel.bindContext(`/Drivers('${driverId}')`);
			const dCtx = await dBinding.requestObject();
			if (dCtx) {
				const d = dCtx as Record<string, unknown>;
				detail.driverName = (d.name as string) ?? "";
				detail.driverContact = (d.contactNumber as string) ?? "";
				detail.driverLicense = (d.licenseNumber as string) ?? "";
			}
			dBinding.destroy();
		}

		const oDialog = await this.getDetailDialog();
		oDialog.setModel(new JSONModel(detail), "detail");
		oDialog.open();
	}

	public async onCloseDetailDialog(): Promise<void> {
		const oDialog = await this.getDetailDialog();
		oDialog.close();
	}

	public onApproveSelected(): void {
		const oTable = this.byId("passesTable") as Table;
		const aSelectedItems = oTable.getSelectedItems();
		if (!aSelectedItems.length) {
			MessageBox.error(this.getResourceText("noSelection"));
			return;
		}

		MessageBox.confirm(this.getResourceText("approveConfirm"), {
			onClose: async (sAction) => {
				if (sAction !== "OK") return;
				const aPaths = aSelectedItems.map(item => item.getBindingContext()!.getPath());
				await this.executeBulkAction(aPaths, "approvePass", null);
			}
		});
	}

	public onRejectSelected(): void {
		const oTable = this.byId("passesTable") as Table;
		const aSelectedItems = oTable.getSelectedItems();
		if (!aSelectedItems.length) {
			MessageBox.error(this.getResourceText("noSelection"));
			return;
		}

		this.showRemarksDialog(async (sRemarks: string) => {
			const aPaths = aSelectedItems.map(item => item.getBindingContext()!.getPath());
			await this.executeBulkAction(aPaths, "rejectPass", sRemarks);
		});
	}

	public onApproveFromDialog(): void {
		MessageBox.confirm(this.getResourceText("approveConfirm"), {
			onClose: async (sAction) => {
				if (sAction !== "OK") return;
				const oDetailModel = (await this.getDetailDialog()).getModel("detail") as JSONModel;
				const sPath = oDetailModel.getProperty("/passPath") as string;
				await this.executeAction(sPath, "approvePass", null);
				this.onCloseDetailDialog();
			}
		});
	}

	public onRejectFromDialog(): void {
		this.showRemarksDialog(async (sRemarks: string) => {
			const oDetailModel = (await this.getDetailDialog()).getModel("detail") as JSONModel;
			const sPath = oDetailModel.getProperty("/passPath") as string;
			await this.executeAction(sPath, "rejectPass", sRemarks);
			this.onCloseDetailDialog();
		});
	}

	private showRemarksDialog(fnCallback: (remarks: string) => Promise<void>): void {
		const oTextArea = new TextArea({ width: "100%", rows: 4 });
		const oDialog = new MDialog({
			title: this.getResourceText("rejectDialogTitle"),
			type: "Message",
			content: [
				new VBox({
					items: [
						new Label({ text: this.getResourceText("remarks") }),
						oTextArea
					]
				})
			],
			beginButton: new MButton({
				text: this.getResourceText("confirm"),
				type: "Emphasized",
				press: async () => {
					const sRemarks = oTextArea.getValue().trim();
					if (!sRemarks) {
						MessageBox.error(this.getResourceText("remarksRequired"));
						return;
					}
					oDialog.close();
					await fnCallback(sRemarks);
				}
			}),
			endButton: new MButton({
				text: this.getResourceText("close"),
				press: () => oDialog.close()
			}),
			afterClose: () => oDialog.destroy()
		});
		oDialog.open();
	}

	private async executeBulkAction(aPaths: string[], sAction: string, sRemarks: string | null): Promise<void> {
		const oModel = this.getView()!.getModel() as ODataModel;
		let successCount = 0;
		let failCount = 0;

		for (const sPath of aPaths) {
			try {
				const oAction = oModel.bindContext(`${sPath}/GatepassService.${sAction}(...)`);
				oAction.setParameter("remarks", sRemarks);
				await oAction.execute();
				oAction.destroy();
				successCount++;
			} catch {
				failCount++;
			}
		}

		const isApprove = sAction === "approvePass";
		if (successCount > 0) {
			MessageToast.show(this.getResourceText(isApprove ? "approveSuccess" : "rejectSuccess"));
		}
		if (failCount > 0) {
			MessageBox.error(this.getResourceText(isApprove ? "approveFailed" : "rejectFailed"));
		}

		this.onRefreshTable();
		(this.byId("passesTable") as Table).removeSelections(true);
	}

	private async executeAction(sPath: string, sAction: string, sRemarks: string | null): Promise<void> {
		try {
			const oModel = this.getView()!.getModel() as ODataModel;
			const oAction = oModel.bindContext(`${sPath}/GatepassService.${sAction}(...)`);
			oAction.setParameter("remarks", sRemarks);
			await oAction.execute();
			oAction.destroy();

			const isApprove = sAction === "approvePass";
			MessageToast.show(this.getResourceText(isApprove ? "approveSuccess" : "rejectSuccess"));
			this.onRefreshTable();
		} catch (err: unknown) {
			const isApprove = sAction === "approvePass";
			MessageBox.error(err instanceof Error ? err.message : this.getResourceText(isApprove ? "approveFailed" : "rejectFailed"));
		}
	}
}
