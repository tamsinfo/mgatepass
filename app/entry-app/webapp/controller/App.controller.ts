import BaseController from "mgatepass/entry/controller/BaseController";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import JSONModel from "sap/ui/model/json/JSONModel";
import Fragment from "sap/ui/core/Fragment";
import MDialog from "sap/m/Dialog";
import TextArea from "sap/m/TextArea";
import MButton from "sap/m/Button";
import type Dialog from "sap/m/Dialog";
import type Button from "sap/m/Button";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataContextBinding from "sap/ui/model/odata/v4/ODataContextBinding";
import type Table from "sap/m/Table";
import type DateRangeSelection from "sap/m/DateRangeSelection";
import type Input from "sap/m/Input";
import type Event from "sap/ui/base/Event";

interface DialogFormData {
	title: string;
	isEditMode: boolean;
	editPassId: string | null;
	editPassPath: string | null;
	processType: string;
	gatepassType: string;
	documentNumber: string;
	weighbridgeEnabled: boolean;
	weighbridgeRequired: boolean;
	showReturnDate: boolean;
	expectedReturnDate: string;
	showCarrierSection: boolean;
	vehicleType: string;
	vehicleNumber: string;
	transporter: string;
	driverName: string;
	driverLicense: string;
	driverContact: string;
	vehicleTypes: Array<{ ID: string; name: string }>;
}

/**
 * @namespace mgatepass.entry.controller
 */
export default class AppController extends BaseController {

	private _pDialog: Promise<Dialog> | null = null;
	private _weighbridgeEnabled = false;

	public override onInit(): void {
		this.initResourceBundle();
		this.loadApprovalRules();
		this.loadAppConfig();
		this.applyFilters();
	}

	private async loadApprovalRules(): Promise<void> {
		const oModel = this.getOwnerComponent()!.getModel() as ODataModel;
		const oBinding = oModel.bindList("/ApprovalRules");
		const aContexts = await oBinding.requestContexts();

		const rules: Record<string, boolean> = {};
		for (const oCtx of aContexts) {
			const sKey = `${oCtx.getProperty("processType")}_${oCtx.getProperty("gatepassType")}`;
			rules[sKey] = oCtx.getProperty("approvalRequired") as boolean;
		}
		oBinding.destroy();

		this.getView()!.setModel(new JSONModel({ loaded: true, rules }), "approvalRules");
	}

	private async loadAppConfig(): Promise<void> {
		const oModel = this.getOwnerComponent()!.getModel() as ODataModel;
		const oBinding = oModel.bindList("/AppConfig");
		const aContexts = await oBinding.requestContexts(0, 1);
		if (aContexts.length > 0) {
			this._weighbridgeEnabled = aContexts[0]!.getProperty("weighbridgeEnabled") as boolean;
		}
		oBinding.destroy();

		const oVTBinding = oModel.bindList("/VehicleTypes");
		const aVTContexts = await oVTBinding.requestContexts();
		const vehicleTypes = aVTContexts.map(ctx => ({
			ID: ctx.getProperty("ID") as string,
			name: ctx.getProperty("name") as string
		}));
		oVTBinding.destroy();

		this.getView()!.setModel(new JSONModel({ vehicleTypes }), "appConfig");
	}

	public isApprovalEnabled(sProcessType: string, sGatepassType: string, bLoaded: boolean): boolean {
		if (!bLoaded || !sProcessType || !sGatepassType) return false;
		const oModel = this.getView()!.getModel("approvalRules") as JSONModel;
		return oModel.getProperty(`/rules/${sProcessType}_${sGatepassType}`) === true;
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

	public applyFilters(): void {
		const oTable = this.byId("passesTable") as Table;
		const oBinding = oTable?.getBinding("items") as ODataListBinding;
		if (!oBinding) return;

		const aFilters: Filter[] = [
			new Filter("status", FilterOperator.EQ, "Draft")
		];

		const oDateRange = this.byId("dateFilter") as DateRangeSelection;
		const dFrom = oDateRange?.getDateValue();
		const dTo = oDateRange?.getSecondDateValue();
		if (dFrom && dTo) {
			const dToEnd = new Date(dTo.getTime());
			dToEnd.setHours(23, 59, 59, 999);
			aFilters.push(new Filter("createdAt", FilterOperator.BT,
				dFrom.toISOString(), dToEnd.toISOString()));
		}

		const sCreatedBy = (this.byId("createdByFilter") as Input)?.getValue()?.trim();
		if (sCreatedBy) {
			aFilters.push(new Filter("createdBy", FilterOperator.Contains, sCreatedBy));
		}

		const sPassNumber = (this.byId("passNumberFilter") as Input)?.getValue()?.trim();
		if (sPassNumber) {
			aFilters.push(new Filter("passNumber", FilterOperator.Contains, sPassNumber));
		}

		oBinding.filter(new Filter({ filters: aFilters, and: true }));
	}

	public onSearch(): void {
		this.applyFilters();
	}

	public onResetFilters(): void {
		(this.byId("dateFilter") as DateRangeSelection).setValue("");
		(this.byId("createdByFilter") as Input).setValue("");
		(this.byId("passNumberFilter") as Input).setValue("");
		this.applyFilters();
	}

	private refreshTable(): void {
		const oTable = this.byId("passesTable") as Table;
		(oTable.getBinding("items") as ODataListBinding).refresh();
	}

	private getDefaultFormData(isEditMode = false): DialogFormData {
		const oConfigModel = this.getView()!.getModel("appConfig") as JSONModel | undefined;
		const vehicleTypes = oConfigModel?.getProperty("/vehicleTypes") ?? [];

		return {
			title: this.getResourceText(isEditMode ? "editGatepassTitle" : "createGatepassTitle"),
			isEditMode,
			editPassId: null,
			editPassPath: null,
			processType: "",
			gatepassType: "",
			documentNumber: "",
			weighbridgeEnabled: this._weighbridgeEnabled,
			weighbridgeRequired: false,
			showReturnDate: false,
			expectedReturnDate: "",
			showCarrierSection: isEditMode,
			vehicleType: "",
			vehicleNumber: "",
			transporter: "",
			driverName: "",
			driverLicense: "",
			driverContact: "",
			vehicleTypes
		};
	}

	private async getDialog(): Promise<Dialog> {
		if (!this._pDialog) {
			this._pDialog = Fragment.load({
				id: this.getView()!.getId(),
				name: "mgatepass.entry.fragment.GatepassDialog",
				controller: this
			}).then(oDialog => {
				this.getView()!.addDependent(oDialog as Dialog);
				return oDialog as Dialog;
			});
		}
		return this._pDialog;
	}

	public async onCreateGatepass(): Promise<void> {
		const oDialog = await this.getDialog();
		oDialog.setModel(new JSONModel(this.getDefaultFormData()), "dialog");
		oDialog.open();
	}

	public async onEditPass(oEvent: Event): Promise<void> {
		const oContext = (oEvent.getSource() as Button).getBindingContext()!;
		const formData = this.getDefaultFormData(true);

		formData.editPassId = oContext.getProperty("ID") as string;
		formData.editPassPath = oContext.getPath();
		formData.processType = oContext.getProperty("processType") as string;
		formData.gatepassType = oContext.getProperty("gatepassType") as string;
		formData.weighbridgeRequired = oContext.getProperty("weighbridgeRequired") as boolean;
		formData.expectedReturnDate = (oContext.getProperty("expectedReturnDate") as string) ?? "";
		formData.showReturnDate = formData.gatepassType === "Returnable";
		formData.showCarrierSection = true;

		const docs = oContext.getProperty("documents") as unknown;
		formData.documentNumber = this.formatDocuments(docs);

		const oModel = this.getView()!.getModel() as ODataModel;

		const vehicleId = oContext.getProperty("vehicle_ID") as string | null;
		if (vehicleId) {
			const vBinding = oModel.bindContext(`/Vehicles('${vehicleId}')`);
			const vCtx = await vBinding.requestObject();
			if (vCtx) {
				formData.vehicleNumber = (vCtx as Record<string, unknown>).vehicleNumber as string ?? "";
				formData.vehicleType = (vCtx as Record<string, unknown>).type_ID as string ?? "";
				formData.transporter = (vCtx as Record<string, unknown>).transporter as string ?? "";
			}
			vBinding.destroy();
		}

		const driverId = oContext.getProperty("driver_ID") as string | null;
		if (driverId) {
			const dBinding = oModel.bindContext(`/Drivers('${driverId}')`);
			const dCtx = await dBinding.requestObject();
			if (dCtx) {
				formData.driverName = (dCtx as Record<string, unknown>).name as string ?? "";
				formData.driverLicense = (dCtx as Record<string, unknown>).licenseNumber as string ?? "";
				formData.driverContact = (dCtx as Record<string, unknown>).contactNumber as string ?? "";
			}
			dBinding.destroy();
		}

		const oDialog = await this.getDialog();
		oDialog.setModel(new JSONModel(formData), "dialog");
		oDialog.open();
	}

	public onProcessTypeChange(): void {
		this.getDialog().then(d => {
			const model = d.getModel("dialog") as JSONModel;
			const isEditMode = model.getProperty("/isEditMode") as boolean;
			const processType = model.getProperty("/processType") as string;
			if (!isEditMode) {
				model.setProperty("/showCarrierSection", processType === "Inward");
			}
		});
	}

	public onGatepassTypeChange(): void {
		this.getDialog().then(d => {
			const model = d.getModel("dialog") as JSONModel;
			const gatepassType = model.getProperty("/gatepassType") as string;
			model.setProperty("/showReturnDate", gatepassType === "Returnable");
		});
	}

	private validateDialogForm(data: DialogFormData): boolean {
		if (!data.processType) {
			MessageBox.error(this.getResourceText("validationProcessType"));
			return false;
		}
		if (!data.gatepassType) {
			MessageBox.error(this.getResourceText("validationGatepassType"));
			return false;
		}
		if (!data.documentNumber?.trim()) {
			MessageBox.error(this.getResourceText("validationDocumentNumber"));
			return false;
		}
		return true;
	}

	public async onSaveGatepass(): Promise<void> {
		const oDialog = await this.getDialog();
		const oDialogModel = oDialog.getModel("dialog") as JSONModel;
		const data = oDialogModel.getData() as DialogFormData;

		if (!this.validateDialogForm(data)) return;

		const documents = data.documentNumber.split(",").map(d => d.trim()).filter(Boolean);

		if (data.isEditMode && data.editPassPath) {
			await this.updateGatepass(data, documents);
		} else {
			await this.createNewGatepass(data, documents);
		}
	}

	private async createNewGatepass(data: DialogFormData, documents: string[]): Promise<void> {
		try {
			const oModel = this.getView()!.getModel() as ODataModel;
			const oAction = oModel.bindContext("/createGatepass(...)") as ODataContextBinding;

			oAction.setParameter("processType", data.processType);
			oAction.setParameter("gatepassType", data.gatepassType);
			oAction.setParameter("documents", documents);
			oAction.setParameter("weighbridgeRequired", data.weighbridgeRequired);
			oAction.setParameter("entryGate", null);
			oAction.setParameter("expectedReturnDate", data.expectedReturnDate || null);

			if (data.showCarrierSection && data.vehicleNumber?.trim()) {
				oAction.setParameter("vehicle", {
					vehicleNumber: data.vehicleNumber.trim(),
					type: data.vehicleType || null,
					transporter: data.transporter?.trim() || null
				});
			} else {
				oAction.setParameter("vehicle", null);
			}

			if (data.showCarrierSection && data.driverName?.trim()) {
				oAction.setParameter("driver", {
					name: data.driverName.trim(),
					licenseNumber: data.driverLicense?.trim() || null,
					contactNumber: data.driverContact?.trim() || null
				});
			} else {
				oAction.setParameter("driver", null);
			}

			await oAction.execute();
			oAction.destroy();

			MessageToast.show(this.getResourceText("gatepassCreated"));
			this.onCloseGatepassDialog();
			this.refreshTable();
		} catch {
			MessageBox.error(this.getResourceText("gatepassCreateFailed"));
		}
	}

	private async updateGatepass(data: DialogFormData, documents: string[]): Promise<void> {
		try {
			const oModel = this.getView()!.getModel() as ODataModel;

			const updateData: Record<string, unknown> = {
				processType: data.processType,
				gatepassType: data.gatepassType,
				documents,
				weighbridgeRequired: data.weighbridgeRequired,
				expectedReturnDate: data.expectedReturnDate || null
			};

			const oBinding = oModel.bindContext(data.editPassPath!, undefined, {
				$$updateGroupId: "gatepassUpdate"
			});
			await oBinding.requestObject();
			const ctx = oBinding.getBoundContext();

			for (const [key, val] of Object.entries(updateData)) {
				ctx.setProperty(key, val);
			}

			await oModel.submitBatch("gatepassUpdate");
			oBinding.destroy();

			MessageToast.show(this.getResourceText("gatepassUpdated"));
			this.onCloseGatepassDialog();
			this.refreshTable();
		} catch {
			MessageBox.error(this.getResourceText("gatepassUpdateFailed"));
		}
	}

	public async onSendForApprovalFromDialog(): Promise<void> {
		const oDialog = await this.getDialog();
		const oDialogModel = oDialog.getModel("dialog") as JSONModel;
		const data = oDialogModel.getData() as DialogFormData;

		if (!data.editPassPath) return;

		MessageBox.confirm(this.getResourceText("sendForApprovalConfirm"), {
			onClose: async (sAction) => {
				if (sAction !== "OK") return;
				try {
					const oModel = this.getView()!.getModel() as ODataModel;
					const oAction = oModel.bindContext(
						`${data.editPassPath}/GatepassService.sendForApproval(...)`
					);
					await oAction.execute();
					oAction.destroy();
					MessageToast.show(this.getResourceText("sentForApproval"));
					this.onCloseGatepassDialog();
					this.refreshTable();
				} catch {
					MessageBox.error(this.getResourceText("sendForApprovalFailed"));
				}
			}
		});
	}

	public async onCloseGatepassDialog(): Promise<void> {
		const oDialog = await this.getDialog();
		oDialog.close();
	}

	public onSendForApproval(oEvent: Event): void {
		const oContext = (oEvent.getSource() as Button).getBindingContext()!;
		const sPassNumber = oContext.getProperty("passNumber") as string;

		MessageBox.confirm(`Send gatepass ${sPassNumber} for approval?`, {
			onClose: async (sAction) => {
				if (sAction !== "OK") return;
				try {
					const oModel = this.getView()!.getModel() as ODataModel;
					const oAction = oModel.bindContext(
						`${oContext.getPath()}/GatepassService.sendForApproval(...)`
					);
					await oAction.execute();
					oAction.destroy();
					MessageToast.show(`Gatepass ${sPassNumber} sent for approval.`);
					this.refreshTable();
				} catch {
					MessageBox.error(`Failed to send gatepass ${sPassNumber} for approval.`);
				}
			}
		});
	}

	public onCancelPass(oEvent: Event): void {
		const oContext = (oEvent.getSource() as Button).getBindingContext()!;
		const sPassNumber = oContext.getProperty("passNumber") as string;

		const oTextArea = new TextArea({ width: "100%", rows: 4 });
		const oCancelDialog = new MDialog({
			title: this.getResourceText("cancelDialogTitle"),
			type: "Message",
			content: [oTextArea],
			beginButton: new MButton({
				text: this.getResourceText("confirm"),
				type: "Emphasized",
				press: async () => {
					const sRemarks = oTextArea.getValue().trim();
					if (!sRemarks) {
						MessageBox.error(this.getResourceText("cancelRemarksRequired"));
						return;
					}
					oCancelDialog.close();
					try {
						const oModel = this.getView()!.getModel() as ODataModel;
						const oAction = oModel.bindContext(
							`${oContext.getPath()}/GatepassService.cancelPass(...)`
						);
						oAction.setParameter("remarks", sRemarks);
						await oAction.execute();
						oAction.destroy();
						MessageToast.show(`Gatepass ${sPassNumber} cancelled.`);
						this.refreshTable();
					} catch {
						MessageBox.error(`Failed to cancel gatepass ${sPassNumber}.`);
					}
				}
			}),
			endButton: new MButton({
				text: this.getResourceText("close"),
				press: () => oCancelDialog.close()
			}),
			afterClose: () => oCancelDialog.destroy()
		});
		oCancelDialog.open();
	}
}
