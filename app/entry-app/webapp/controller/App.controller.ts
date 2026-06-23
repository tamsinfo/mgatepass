import BaseController from "mgatepass/entry/controller/BaseController";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import JSONModel from "sap/ui/model/json/JSONModel";
import Fragment from "sap/ui/core/Fragment";
import Label from "sap/m/Label";
import MDialog from "sap/m/Dialog";
import TextArea from "sap/m/TextArea";
import MButton from "sap/m/Button";
import VBox from "sap/m/VBox";
import Token from "sap/m/Token";
import Column from "sap/m/Column";
import ColumnListItem from "sap/m/ColumnListItem";
import Text from "sap/m/Text";
import Input from "sap/m/Input";
import type Dialog from "sap/m/Dialog";
import type Button from "sap/m/Button";
import type MultiInput from "sap/m/MultiInput";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataContextBinding from "sap/ui/model/odata/v4/ODataContextBinding";
import type Table from "sap/m/Table";
import type DateRangeSelection from "sap/m/DateRangeSelection";
import type Event from "sap/ui/base/Event";

interface VehicleTypeConfig {
	ID: string;
	name: string;
	requireTransporterName: boolean;
	requireDriverName: boolean;
	requireDriverContact: boolean;
	requireVehicleNumber: boolean;
	requireDriverLicense: boolean;
}

interface CarrierFieldState {
	vehicleNumber: boolean;
	transporter: boolean;
	driverName: boolean;
	driverLicense: boolean;
	driverContact: boolean;
}

interface GatepassTypeOption {
	key: string;
	text: string;
}

interface DialogFormData {
	title: string;
	isEditMode: boolean;
	editPassId: string | null;
	editPassPath: string | null;
	processType: string;
	gatepassType: string;
	gatepassTypeOptions: GatepassTypeOption[];
	showDocuments: boolean;
	documentSectionTitle: string;
	documentInputLabel: string;
	documents: string[];
	weighbridgeEnabled: boolean;
	weighbridgeRequired: boolean;
	showReturnDate: boolean;
	returnDateRequired: boolean;
	expectedReturnDate: string;
	showCarrierSection: boolean;
	vehicleType: string;
	vehicleNumber: string;
	transporter: string;
	driverName: string;
	driverLicense: string;
	driverContact: string;
	entryGate: string;
	approvalRequired: boolean;
	vehicleTypes: VehicleTypeConfig[];
	gates: Array<{ ID: string; name: string }>;
	carrierFields: CarrierFieldState;
	items: ItemData[];
}

const ALL_CARRIER_ENABLED: CarrierFieldState = {
	vehicleNumber: true,
	transporter: true,
	driverName: true,
	driverLicense: true,
	driverContact: true
};

interface ColumnDef {
	labelKey: string;
	property: string;
	isInput?: boolean;
	showUnit?: boolean;
}

interface ItemData {
	lineItem: string;
	documentNumber: string;
	materialCode: string;
	materialDescription: string;
	partyName: string;
	orderQuantity: number | null;
	openQuantity: number | null;
	receivedQuantity: number | null;
	issueQuantity: number | null;
	purchaseOrder: string | null;
	unitOfMeasurement: string | null;
}

const COLUMN_CONFIGS: Record<string, ColumnDef[]> = {
	Inward_NonReturnable: [
		{ labelKey: "colDocNumber", property: "documentNumber" },
		{ labelKey: "colLineItem", property: "lineItem" },
		{ labelKey: "colMaterialCode", property: "materialCode" },
		{ labelKey: "colMaterialDesc", property: "materialDescription" },
		{ labelKey: "colPartyName", property: "partyName" },
		{ labelKey: "colOrderQty", property: "orderQuantity", showUnit: true },
		{ labelKey: "colOpenQty", property: "openQuantity", showUnit: true },
		{ labelKey: "colReceivedQty", property: "receivedQuantity", isInput: true }
	],
	Outward_NonReturnable: [
		{ labelKey: "colDocNumber", property: "documentNumber" },
		{ labelKey: "colLineItem", property: "lineItem" },
		{ labelKey: "colMaterialCode", property: "materialCode" },
		{ labelKey: "colMaterialDesc", property: "materialDescription" },
		{ labelKey: "colPartyName", property: "partyName" },
		{ labelKey: "colBillingQty", property: "orderQuantity", showUnit: true },
		{ labelKey: "colIssueQty", property: "issueQuantity", isInput: true }
	],
	Inward_Returnable: [
		{ labelKey: "colDocNumber", property: "documentNumber" },
		{ labelKey: "colLineItem", property: "lineItem" },
		{ labelKey: "colPurchaseOrder", property: "purchaseOrder" },
		{ labelKey: "colMaterialCode", property: "materialCode" },
		{ labelKey: "colMaterialDesc", property: "materialDescription" },
		{ labelKey: "colPartyName", property: "partyName" },
		{ labelKey: "colChallanQty", property: "orderQuantity", showUnit: true },
		{ labelKey: "colReceivedQty", property: "receivedQuantity", isInput: true }
	],
	Outward_Returnable: [
		{ labelKey: "colDocNumber", property: "documentNumber" },
		{ labelKey: "colLineItem", property: "lineItem" },
		{ labelKey: "colMaterialCode", property: "materialCode" },
		{ labelKey: "colMaterialDesc", property: "materialDescription" },
		{ labelKey: "colPartyName", property: "partyName" },
		{ labelKey: "colChallanQty", property: "orderQuantity", showUnit: true },
		{ labelKey: "colIssueQty", property: "issueQuantity", isInput: true }
	],
	Inward_AgainstOutwardRGP: [
		{ labelKey: "colDocNumber", property: "documentNumber" },
		{ labelKey: "colLineItem", property: "lineItem" },
		{ labelKey: "colMaterialCode", property: "materialCode" },
		{ labelKey: "colMaterialDesc", property: "materialDescription" },
		{ labelKey: "colPartyName", property: "partyName" },
		{ labelKey: "colChallanQty", property: "orderQuantity", showUnit: true },
		{ labelKey: "colReceivedQty", property: "receivedQuantity", isInput: true }
	],
	Outward_AgainstInwardRGP: [
		{ labelKey: "colDocNumber", property: "documentNumber" },
		{ labelKey: "colLineItem", property: "lineItem" },
		{ labelKey: "colMaterialCode", property: "materialCode" },
		{ labelKey: "colMaterialDesc", property: "materialDescription" },
		{ labelKey: "colPartyName", property: "partyName" },
		{ labelKey: "colChallanQty", property: "orderQuantity", showUnit: true },
		{ labelKey: "colIssueQty", property: "issueQuantity", isInput: true }
	]
};

/**
 * @namespace mgatepass.entry.controller
 */
export default class AppController extends BaseController {

	private _pDialog: Promise<Dialog> | null = null;
	private _weighbridgeEnabled = false;
	private _vehicleTypes: VehicleTypeConfig[] = [];
	private _gates: Array<{ ID: string; name: string }> = [];

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
		this._vehicleTypes = aVTContexts.map(ctx => ({
			ID: ctx.getProperty("ID") as string,
			name: ctx.getProperty("name") as string,
			requireTransporterName: ctx.getProperty("requireTransporterName") as boolean,
			requireDriverName: ctx.getProperty("requireDriverName") as boolean,
			requireDriverContact: ctx.getProperty("requireDriverContact") as boolean,
			requireVehicleNumber: ctx.getProperty("requireVehicleNumber") as boolean,
			requireDriverLicense: ctx.getProperty("requireDriverLicense") as boolean
		}));
		oVTBinding.destroy();

		const oGateBinding = oModel.bindList("/Gates", undefined, undefined, [
			new Filter("allowEntry", FilterOperator.EQ, true)
		]);
		const aGateContexts = await oGateBinding.requestContexts();
		this._gates = aGateContexts.map(ctx => ({
			ID: ctx.getProperty("ID") as string,
			name: ctx.getProperty("name") as string
		}));
		oGateBinding.destroy();
	}

	public isApprovalEnabled(sProcessType: string, sGatepassType: string, bLoaded: boolean): boolean {
		if (!bLoaded || !sProcessType || !sGatepassType) return false;
		const oModel = this.getView()!.getModel("approvalRules") as JSONModel;
		return oModel.getProperty(`/rules/${sProcessType}_${sGatepassType}`) === true;
	}

	public applyFilters(): void {
		const oTable = this.byId("passesTable") as Table;
		const oBinding = oTable?.getBinding("items") as ODataListBinding;
		if (!oBinding) return;

		const aFilters: Filter[] = [];
		aFilters.push(new Filter("status", FilterOperator.EQ, "Draft"));

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

		oBinding.filter(aFilters);
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

	public onRefreshTable(): void {
		this.refreshTable();
	}

	private refreshTable(): void {
		const oTable = this.byId("passesTable") as Table;
		const oBinding = oTable?.getBinding("items") as ODataListBinding;
		if (oBinding) oBinding.refresh();
	}

	private getGatepassTypeOptions(processType: string): GatepassTypeOption[] {
		const all: GatepassTypeOption[] = [
			{ key: "", text: "" },
			{ key: "NonReturnable", text: this.getResourceText("gatepassTypeNonReturnable") },
			{ key: "Returnable", text: this.getResourceText("gatepassTypeReturnable") }
		];
		if (processType === "Inward") {
			all.push({ key: "AgainstOutwardRGP", text: this.getResourceText("gatepassTypeAgainstOutwardRGP") });
		} else if (processType === "Outward") {
			all.push({ key: "AgainstInwardRGP", text: this.getResourceText("gatepassTypeAgainstInwardRGP") });
		}
		return all;
	}

	private isReturnDateRequired(_processType: string, gatepassType: string): boolean {
		return gatepassType === "Returnable";
	}

	private needsDocuments(processType: string, gatepassType: string): boolean {
		return !(processType === "Inward" && gatepassType === "Returnable");
	}

	private getDefaultFormData(isEditMode = false): DialogFormData {
		return {
			title: this.getResourceText(isEditMode ? "editGatepassTitle" : "createGatepassTitle"),
			isEditMode,
			editPassId: null,
			editPassPath: null,
			processType: "",
			gatepassType: "",
			gatepassTypeOptions: this.getGatepassTypeOptions(""),
			showDocuments: true,
			documentSectionTitle: this.getResourceText("sectionDocuments"),
			documentInputLabel: this.getResourceText("documentNumberInput"),
			documents: [],
			weighbridgeEnabled: this._weighbridgeEnabled,
			weighbridgeRequired: false,
			showReturnDate: false,
			returnDateRequired: false,
			expectedReturnDate: "",
			showCarrierSection: isEditMode,
			vehicleType: "",
			vehicleNumber: "",
			transporter: "",
			driverName: "",
			driverLicense: "",
			driverContact: "",
			entryGate: "",
			approvalRequired: false,
			vehicleTypes: this._vehicleTypes,
			gates: this._gates,
			carrierFields: { ...ALL_CARRIER_ENABLED },
			items: []
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
		(this.byId("documentNumberInput") as MultiInput).removeAllTokens();
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
		formData.gatepassTypeOptions = this.getGatepassTypeOptions(formData.processType);
		formData.showDocuments = this.needsDocuments(formData.processType, formData.gatepassType);
		formData.showReturnDate = formData.gatepassType === "Returnable" || this.isReturnDateRequired(formData.processType, formData.gatepassType);
		formData.returnDateRequired = this.isReturnDateRequired(formData.processType, formData.gatepassType);
		const isAgainstRGP = formData.gatepassType === "AgainstOutwardRGP" || formData.gatepassType === "AgainstInwardRGP";
		formData.documentSectionTitle = this.getResourceText(isAgainstRGP ? "sectionGatepasses" : "sectionDocuments");
		formData.documentInputLabel = this.getResourceText(isAgainstRGP ? "gatepassNumberInput" : "documentNumberInput");
		formData.showCarrierSection = true;
		formData.entryGate = (oContext.getProperty("entryGate_ID") as string) ?? "";

		const rulesModel = this.getView()!.getModel("approvalRules") as JSONModel;
		formData.approvalRequired = rulesModel?.getProperty(`/rules/${formData.processType}_${formData.gatepassType}`) === true;

		const rawDocs = await oContext.requestObject("documents") as unknown;
		const documents: string[] = Array.isArray(rawDocs)
			? rawDocs.map((d: unknown) => typeof d === "object" && d !== null ? String((d as Record<string, unknown>).value ?? "") : String(d)).filter(Boolean)
			: [];

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

		if (formData.vehicleType) {
			this.applyCarrierFieldRules(formData, formData.vehicleType);
		}

		const itemsBinding = oModel.bindList(`${formData.editPassPath}/items`);
		const itemContexts = await itemsBinding.requestContexts();
		formData.items = itemContexts.map(ctx => ({
			lineItem: ctx.getProperty("lineItem") as string ?? "",
			documentNumber: ctx.getProperty("documentNumber") as string ?? "",
			materialCode: ctx.getProperty("materialCode") as string ?? "",
			materialDescription: ctx.getProperty("materialDescription") as string ?? "",
			partyName: ctx.getProperty("partyName") as string ?? "",
			orderQuantity: ctx.getProperty("orderQuantity") as number | null,
			openQuantity: ctx.getProperty("openQuantity") as number | null,
			receivedQuantity: ctx.getProperty("receivedQuantity") as number | null,
			issueQuantity: ctx.getProperty("issueQuantity") as number | null,
			purchaseOrder: ctx.getProperty("purchaseOrder") as string | null,
			unitOfMeasurement: ctx.getProperty("unitOfMeasurement") as string | null
		}));
		itemsBinding.destroy();

		const oDialog = await this.getDialog();
		oDialog.setModel(new JSONModel(formData), "dialog");
		oDialog.open();

		const combo = `${formData.processType}_${formData.gatepassType}`;
		if (formData.items.length && COLUMN_CONFIGS[combo]) {
			this.buildItemsTable(combo);
		}

		const oDocInput = this.byId("documentNumberInput") as MultiInput;
		oDocInput.removeAllTokens();
		for (const doc of documents) {
			oDocInput.addToken(new Token({ key: doc, text: doc }));
		}
	}

	public onProcessTypeChange(): void {
		this.getDialog().then(d => {
			const model = d.getModel("dialog") as JSONModel;
			const isEditMode = model.getProperty("/isEditMode") as boolean;
			const processType = model.getProperty("/processType") as string;
			if (!isEditMode) {
				model.setProperty("/showCarrierSection", processType === "Inward");
			}
			model.setProperty("/gatepassTypeOptions", this.getGatepassTypeOptions(processType));
			const currentType = model.getProperty("/gatepassType") as string;
			const validKeys = this.getGatepassTypeOptions(processType).map(o => o.key);
			if (currentType && !validKeys.includes(currentType)) {
				model.setProperty("/gatepassType", "");
				model.setProperty("/showReturnDate", false);
				model.setProperty("/returnDateRequired", false);
				model.setProperty("/showDocuments", true);
			} else {
				model.setProperty("/showDocuments", this.needsDocuments(processType, model.getProperty("/gatepassType") as string));
			}
			this.updateApprovalRequired(model);
		});
	}

	public onGatepassTypeChange(): void {
		this.getDialog().then(d => {
			const model = d.getModel("dialog") as JSONModel;
			const processType = model.getProperty("/processType") as string;
			const gatepassType = model.getProperty("/gatepassType") as string;
			const showReturn = gatepassType === "Returnable" || this.isReturnDateRequired(processType, gatepassType);
			model.setProperty("/showReturnDate", showReturn);
			model.setProperty("/returnDateRequired", this.isReturnDateRequired(processType, gatepassType));
			model.setProperty("/showDocuments", this.needsDocuments(processType, gatepassType));
			const isAgainstRGP = gatepassType === "AgainstOutwardRGP" || gatepassType === "AgainstInwardRGP";
			model.setProperty("/documentSectionTitle", this.getResourceText(isAgainstRGP ? "sectionGatepasses" : "sectionDocuments"));
			model.setProperty("/documentInputLabel", this.getResourceText(isAgainstRGP ? "gatepassNumberInput" : "documentNumberInput"));
			this.updateApprovalRequired(model);
		});
	}

	private updateApprovalRequired(dialogModel: JSONModel): void {
		const processType = dialogModel.getProperty("/processType") as string;
		const gatepassType = dialogModel.getProperty("/gatepassType") as string;
		const rulesModel = this.getView()!.getModel("approvalRules") as JSONModel;
		const required = rulesModel?.getProperty(`/rules/${processType}_${gatepassType}`) === true;
		dialogModel.setProperty("/approvalRequired", required);
	}

	public onAddDocument(): void {
		const oInput = this.byId("documentNumberInput") as MultiInput;
		const sValue = oInput.getValue()?.trim();
		if (!sValue) return;
		oInput.addToken(new Token({ key: sValue, text: sValue }));
		oInput.setValue("");
	}

	public async onDocumentGo(): Promise<void> {
		const oDialog = await this.getDialog();
		const oDialogModel = oDialog.getModel("dialog") as JSONModel;
		const processType = oDialogModel.getProperty("/processType") as string;
		const gatepassType = oDialogModel.getProperty("/gatepassType") as string;

		if (!processType || !gatepassType) {
			MessageBox.error(this.getResourceText("validationSelectTypes"));
			return;
		}

		const oDocInput = this.byId("documentNumberInput") as MultiInput;
		const pendingValue = oDocInput.getValue()?.trim();
		if (pendingValue) {
			oDocInput.addToken(new Token({ key: pendingValue, text: pendingValue }));
			oDocInput.setValue("");
		}
		const documents = oDocInput.getTokens().map(t => t.getKey());
		if (!documents.length) {
			MessageBox.error(this.getResourceText("validationEnterDocuments"));
			return;
		}

		try {
			const oModel = this.getView()!.getModel() as ODataModel;
			const oAction = oModel.bindContext("/fetchDocumentItems(...)") as ODataContextBinding;
			oAction.setParameter("processType", processType);
			oAction.setParameter("gatepassType", gatepassType);
			oAction.setParameter("documents", documents);
			await oAction.execute();

			const result = (oAction.getBoundContext()!.getObject() as Record<string, unknown>).value as ItemData[] | undefined;
			const items: ItemData[] = (result || []).map(item => ({
				...item,
				receivedQuantity: item.receivedQuantity ?? null,
				issueQuantity: item.issueQuantity ?? null
			}));
			oAction.destroy();

			oDialogModel.setProperty("/items", items);
			this.buildItemsTable(`${processType}_${gatepassType}`);
		} catch (err: unknown) {
			MessageBox.error(err instanceof Error ? err.message : this.getResourceText("fetchItemsFailed"));
		}
	}

	private buildItemsTable(combo: string): void {
		const columns = COLUMN_CONFIGS[combo];
		if (!columns) return;

		const oTable = this.byId("documentItemsTable") as Table;
		oTable.destroyColumns();
		oTable.unbindItems();

		for (const col of columns) {
			oTable.addColumn(new Column({
				header: new Text({ text: this.getResourceText(col.labelKey) })
			}));
		}

		oTable.bindItems({
			path: "dialog>/items",
			template: new ColumnListItem({
				cells: columns.map(col => {
					if (col.isInput) {
						return new Input({
							value: `{dialog>${col.property}}`,
							type: "Number"
						});
					}
					if (col.showUnit) {
						return new Text({
							text: {
								parts: [{ path: `dialog>${col.property}` }, { path: "dialog>unitOfMeasurement" }],
								formatter: (qty: number | null, uom: string | null) => {
									if (qty == null) return "";
									return uom ? `${qty} ${uom}` : String(qty);
								}
							} as object
						});
					}
					return new Text({ text: `{dialog>${col.property}}` });
				})
			})
		});
	}

	public onVehicleTypeChange(): void {
		this.getDialog().then(d => {
			const model = d.getModel("dialog") as JSONModel;
			const selectedTypeId = model.getProperty("/vehicleType") as string;
			const data = model.getData() as DialogFormData;
			this.applyCarrierFieldRules(data, selectedTypeId);
			model.setData(data);
		});
	}

	private applyCarrierFieldRules(data: DialogFormData, vehicleTypeId: string): void {
		if (!vehicleTypeId) {
			data.carrierFields = { ...ALL_CARRIER_ENABLED };
			return;
		}

		const vt = this._vehicleTypes.find(t => t.ID === vehicleTypeId);
		if (!vt) {
			data.carrierFields = { ...ALL_CARRIER_ENABLED };
			return;
		}

		data.carrierFields = {
			vehicleNumber: vt.requireVehicleNumber,
			transporter: vt.requireTransporterName,
			driverName: vt.requireDriverName,
			driverLicense: vt.requireDriverLicense,
			driverContact: vt.requireDriverContact
		};

		data.vehicleNumber = vt.requireVehicleNumber ? (data.vehicleNumber === "N/A" ? "" : data.vehicleNumber) : "N/A";
		data.transporter = vt.requireTransporterName ? (data.transporter === "N/A" ? "" : data.transporter) : "N/A";
		data.driverName = vt.requireDriverName ? (data.driverName === "N/A" ? "" : data.driverName) : "N/A";
		data.driverLicense = vt.requireDriverLicense ? (data.driverLicense === "N/A" ? "" : data.driverLicense) : "N/A";
		data.driverContact = vt.requireDriverContact ? (data.driverContact === "N/A" ? "" : data.driverContact) : "N/A";
	}

	private validateDialogForm(data: DialogFormData, documents: string[]): boolean {
		if (!data.processType) {
			MessageBox.error(this.getResourceText("validationProcessType"));
			return false;
		}
		if (!data.gatepassType) {
			MessageBox.error(this.getResourceText("validationGatepassType"));
			return false;
		}
		if (this.needsDocuments(data.processType, data.gatepassType) && documents.length === 0) {
			MessageBox.error(this.getResourceText("validationDocumentNumber"));
			return false;
		}
		if (this.isReturnDateRequired(data.processType, data.gatepassType) && !data.expectedReturnDate) {
			MessageBox.error(this.getResourceText("validationExpectedReturnDate"));
			return false;
		}
		return true;
	}

	public async onSaveGatepass(): Promise<void> {
		const oDialog = await this.getDialog();
		const oDialogModel = oDialog.getModel("dialog") as JSONModel;
		const data = oDialogModel.getData() as DialogFormData;

		const oDocInput = this.byId("documentNumberInput") as MultiInput;
		const pendingValue = oDocInput.getValue()?.trim();
		if (pendingValue) {
			oDocInput.addToken(new Token({ key: pendingValue, text: pendingValue }));
			oDocInput.setValue("");
		}
		const documents = oDocInput.getTokens().map(t => t.getKey());

		if (!this.validateDialogForm(data, documents)) return;

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
			oAction.setParameter("entryGate", data.entryGate || null);
			oAction.setParameter("expectedReturnDate", data.expectedReturnDate || null);

			if (data.showCarrierSection && (data.vehicleType || (data.vehicleNumber?.trim() && data.vehicleNumber !== "N/A"))) {
				oAction.setParameter("vehicle", {
					vehicleNumber: data.vehicleNumber?.trim() || "N/A",
					type: data.vehicleType || null,
					transporter: data.transporter !== "N/A" ? (data.transporter?.trim() || null) : null
				});
			} else {
				oAction.setParameter("vehicle", null);
			}

			if (data.showCarrierSection && data.driverName?.trim() && data.driverName !== "N/A") {
				oAction.setParameter("driver", {
					name: data.driverName.trim(),
					licenseNumber: data.driverLicense !== "N/A" ? (data.driverLicense?.trim() || null) : null,
					contactNumber: data.driverContact !== "N/A" ? (data.driverContact?.trim() || null) : null
				});
			} else {
				oAction.setParameter("driver", null);
			}

			oAction.setParameter("items", data.items.length ? data.items : null);

			await oAction.execute();
			oAction.destroy();

			MessageToast.show(this.getResourceText("gatepassCreated"));
			this.onCloseGatepassDialog();
			this.refreshTable();
		} catch (err: unknown) {
			MessageBox.error(err instanceof Error ? err.message : this.getResourceText("gatepassCreateFailed"));
		}
	}

	private async updateGatepass(data: DialogFormData, _documents: string[]): Promise<void> {
		try {
			const oModel = this.getView()!.getModel() as ODataModel;
			const oAction = oModel.bindContext(
				`${data.editPassPath}/GatepassService.updateGatepass(...)`
			) as ODataContextBinding;

			oAction.setParameter("weighbridgeRequired", data.weighbridgeRequired);
			oAction.setParameter("entryGate", data.entryGate || null);
			oAction.setParameter("expectedReturnDate", data.expectedReturnDate || null);

			if (data.showCarrierSection && (data.vehicleType || (data.vehicleNumber?.trim() && data.vehicleNumber !== "N/A"))) {
				oAction.setParameter("vehicle", {
					vehicleNumber: data.vehicleNumber?.trim() || "N/A",
					type: data.vehicleType || null,
					transporter: data.transporter !== "N/A" ? (data.transporter?.trim() || null) : null
				});
			} else {
				oAction.setParameter("vehicle", null);
			}

			if (data.showCarrierSection && data.driverName?.trim() && data.driverName !== "N/A") {
				oAction.setParameter("driver", {
					name: data.driverName.trim(),
					licenseNumber: data.driverLicense !== "N/A" ? (data.driverLicense?.trim() || null) : null,
					contactNumber: data.driverContact !== "N/A" ? (data.driverContact?.trim() || null) : null
				});
			} else {
				oAction.setParameter("driver", null);
			}

			oAction.setParameter("items", data.items.length ? data.items : null);

			await oAction.execute();
			oAction.destroy();

			MessageToast.show(this.getResourceText("gatepassUpdated"));
			this.onCloseGatepassDialog();
			this.refreshTable();
		} catch (err: unknown) {
			MessageBox.error(err instanceof Error ? err.message : this.getResourceText("gatepassUpdateFailed"));
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
				} catch (err: unknown) {
					MessageBox.error(err instanceof Error ? err.message : this.getResourceText("sendForApprovalFailed"));
				}
			}
		});
	}

	public async onFinaliseGatepassFromDialog(): Promise<void> {
		const oDialog = await this.getDialog();
		const oDialogModel = oDialog.getModel("dialog") as JSONModel;
		const data = oDialogModel.getData() as DialogFormData;

		if (!data.editPassPath) return;

		try {
			const oModel = this.getView()!.getModel() as ODataModel;
			const oAction = oModel.bindContext(
				`${data.editPassPath}/GatepassService.finaliseGatepass(...)`
			);
			await oAction.execute();
			oAction.destroy();
			MessageToast.show(this.getResourceText("gatepassFinalised"));
			this.onCloseGatepassDialog();
			this.refreshTable();
		} catch (err: unknown) {
			MessageBox.error(err instanceof Error ? err.message : this.getResourceText("gatepassFinaliseFailed"));
		}
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
				} catch (err: unknown) {
					MessageBox.error(err instanceof Error ? err.message : `Failed to send gatepass ${sPassNumber} for approval.`);
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
					} catch (err: unknown) {
						MessageBox.error(err instanceof Error ? err.message : `Failed to cancel gatepass ${sPassNumber}.`);
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
