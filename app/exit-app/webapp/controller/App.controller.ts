import BaseController from "mgatepass/exit/controller/BaseController";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import JSONModel from "sap/ui/model/json/JSONModel";
import Fragment from "sap/ui/core/Fragment";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import Column from "sap/m/Column";
import ColumnListItem from "sap/m/ColumnListItem";
import Text from "sap/m/Text";
import type Dialog from "sap/m/Dialog";
import type Button from "sap/m/Button";
import type Input from "sap/m/Input";
import type Select from "sap/m/Select";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type Table from "sap/m/Table";
import type DateRangeSelection from "sap/m/DateRangeSelection";
import type Event from "sap/ui/base/Event";
import formatter from "mgatepass/exit/model/formatter";

interface GateItem {
	ID: string;
	name: string;
}

interface ColumnDef {
	labelKey: string;
	property: string;
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

const ITEM_COLUMNS: Record<string, ColumnDef[]> = {
	Inward_NonReturnable: [
		{ labelKey: "colDocNumber", property: "documentNumber" },
		{ labelKey: "colLineItem", property: "lineItem" },
		{ labelKey: "colMaterialCode", property: "materialCode" },
		{ labelKey: "colMaterialDesc", property: "materialDescription" },
		{ labelKey: "colPartyName", property: "partyName" },
		{ labelKey: "colOrderQty", property: "orderQuantity", showUnit: true },
		{ labelKey: "colOpenQty", property: "openQuantity", showUnit: true },
		{ labelKey: "colReceivedQty", property: "receivedQuantity", showUnit: true }
	],
	Outward_NonReturnable: [
		{ labelKey: "colDocNumber", property: "documentNumber" },
		{ labelKey: "colLineItem", property: "lineItem" },
		{ labelKey: "colMaterialCode", property: "materialCode" },
		{ labelKey: "colMaterialDesc", property: "materialDescription" },
		{ labelKey: "colPartyName", property: "partyName" },
		{ labelKey: "colBillingQty", property: "orderQuantity", showUnit: true },
		{ labelKey: "colIssueQty", property: "issueQuantity", showUnit: true }
	],
	Inward_Returnable: [
		{ labelKey: "colDocNumber", property: "documentNumber" },
		{ labelKey: "colLineItem", property: "lineItem" },
		{ labelKey: "colPurchaseOrder", property: "purchaseOrder" },
		{ labelKey: "colMaterialCode", property: "materialCode" },
		{ labelKey: "colMaterialDesc", property: "materialDescription" },
		{ labelKey: "colPartyName", property: "partyName" },
		{ labelKey: "colChallanQty", property: "orderQuantity", showUnit: true },
		{ labelKey: "colReceivedQty", property: "receivedQuantity", showUnit: true }
	],
	Outward_Returnable: [
		{ labelKey: "colDocNumber", property: "documentNumber" },
		{ labelKey: "colLineItem", property: "lineItem" },
		{ labelKey: "colMaterialCode", property: "materialCode" },
		{ labelKey: "colMaterialDesc", property: "materialDescription" },
		{ labelKey: "colPartyName", property: "partyName" },
		{ labelKey: "colChallanQty", property: "orderQuantity", showUnit: true },
		{ labelKey: "colIssueQty", property: "issueQuantity", showUnit: true }
	],
	Inward_AgainstOutwardRGP: [
		{ labelKey: "colDocNumber", property: "documentNumber" },
		{ labelKey: "colLineItem", property: "lineItem" },
		{ labelKey: "colMaterialCode", property: "materialCode" },
		{ labelKey: "colMaterialDesc", property: "materialDescription" },
		{ labelKey: "colPartyName", property: "partyName" },
		{ labelKey: "colChallanQty", property: "orderQuantity", showUnit: true },
		{ labelKey: "colReceivedQty", property: "receivedQuantity", showUnit: true }
	],
	Outward_AgainstInwardRGP: [
		{ labelKey: "colDocNumber", property: "documentNumber" },
		{ labelKey: "colLineItem", property: "lineItem" },
		{ labelKey: "colMaterialCode", property: "materialCode" },
		{ labelKey: "colMaterialDesc", property: "materialDescription" },
		{ labelKey: "colPartyName", property: "partyName" },
		{ labelKey: "colChallanQty", property: "orderQuantity", showUnit: true },
		{ labelKey: "colIssueQty", property: "issueQuantity", showUnit: true }
	]
};

interface DetailData {
	passNumber: string;
	createdAt: string;
	createdBy: string;
	processType: string;
	gatepassType: string;
	documents: string;
	approvedAt: string;
	approvedBy: string;
	isReturnable: boolean;
	expectedReturnDate: string;
	carrierType: string;
	transporterName: string;
	driverName: string;
	driverContact: string;
	driverLicense: string;
	vehicleNumber: string;
	entryWeight: string;
	exitWeight: string;
	netWeight: string;
	hasWeights: boolean;
	exitGateId: string;
	passPath: string;
	items: ItemData[];
}

/**
 * @namespace mgatepass.exit.controller
 */
export default class AppController extends BaseController {

	private _pDetailDialog: Promise<Dialog> | null = null;

	public override onInit(): void {
		this.initResourceBundle();
		this.getView()!.setModel(new JSONModel({ weightUnit: "" }), "config");
		this.getView()!.setModel(new JSONModel([]), "gates");
		this.loadAppConfig();
		this.loadExitGates();
		this.applyFilters();
	}

	private async loadAppConfig(): Promise<void> {
		const oModel = this.getOwnerComponent()!.getModel() as ODataModel;
		const oBinding = oModel.bindList("/AppConfig");
		const aContexts = await oBinding.requestContexts(0, 1);
		if (aContexts.length > 0) {
			const weightUnit = (aContexts[0]!.getProperty("weightUnit") as string) || "kg";
			(this.getView()!.getModel("config") as JSONModel).setProperty("/weightUnit", weightUnit);
		}
		oBinding.destroy();
	}

	private async loadExitGates(): Promise<void> {
		const oModel = this.getOwnerComponent()!.getModel() as ODataModel;
		const oBinding = oModel.bindList("/Gates", undefined, undefined, [
			new Filter("allowExit", FilterOperator.EQ, true)
		]);
		const aContexts = await oBinding.requestContexts();
		const gates: GateItem[] = aContexts.map(ctx => ({
			ID: ctx.getProperty("ID") as string,
			name: ctx.getProperty("name") as string
		}));
		(this.getView()!.getModel("gates") as JSONModel).setData(gates);
		oBinding.destroy();
	}

	public applyFilters(): void {
		const oTable = this.byId("passesTable") as Table;
		const oBinding = oTable?.getBinding("items") as ODataListBinding;
		if (!oBinding) return;

		const aFilters: Filter[] = [];

		aFilters.push(new Filter("status", FilterOperator.EQ, "GateExitPending"));

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
		if (oBinding.isSuspended()) oBinding.resume();
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

	public formatColumnWithUnit(label: string, unit: string): string {
		return `${label} (${unit || "kg"})`;
	}

	public formatWeight(weight: unknown): string {
		if (weight == null) return "";
		return String(weight);
	}

	public formatNetWeight(entryWeight: unknown, exitWeight: unknown): string {
		if (entryWeight == null || exitWeight == null) return "";
		const net = Math.abs(Number(exitWeight) - Number(entryWeight));
		return net.toFixed(3);
	}

	public onRefreshTable(): void {
		const oTable = this.byId("passesTable") as Table;
		const oBinding = oTable?.getBinding("items") as ODataListBinding;
		if (oBinding) {
			oBinding.refresh();
			this.applyFilters();
		}
	}

	private extractErrorMessage(err: unknown): string {
		if (err && typeof err === "object") {
			const e = err as Record<string, unknown>;
			if (e.error && typeof e.error === "object") {
				const inner = e.error as Record<string, unknown>;
				if (typeof inner.message === "string") return inner.message;
			}
			if (typeof e.message === "string") return e.message;
		}
		if (err instanceof Error) return err.message;
		return String(err);
	}

	private async getDetailDialog(): Promise<Dialog> {
		if (!this._pDetailDialog) {
			this._pDetailDialog = Fragment.load({
				id: this.getView()!.getId(),
				name: "mgatepass.exit.fragment.DetailDialog",
				controller: this
			}).then(oDialog => {
				this.getView()!.addDependent(oDialog as Dialog);
				return oDialog as Dialog;
			});
		}
		return this._pDetailDialog;
	}

	public async onViewDetails(oEvent: Event): Promise<void> {
		try {
			const oContext = (oEvent.getSource() as Button).getBindingContext()!;
			const oModel = this.getView()!.getModel() as ODataModel;
			const gatepassType = oContext.getProperty("gatepassType") as string;

			const rawDocs = await (oContext as any).requestObject("documents") as unknown;

			const entryWeight = oContext.getProperty("weight/entryWeight") as number | null;
			const exitWeight = oContext.getProperty("weight/exitWeight") as number | null;
			const hasWeights = oContext.getProperty("weight_ID") != null;

			const processType = oContext.getProperty("processType") as string;
			const detail: DetailData = {
				passNumber: oContext.getProperty("passNumber") as string,
				createdAt: oContext.getProperty("createdAt") as string,
				createdBy: oContext.getProperty("createdBy") as string,
				processType,
				gatepassType,
				documents: formatter.formatDocuments(rawDocs),
				approvedAt: oContext.getProperty("approvedAt") as string,
				approvedBy: (oContext.getProperty("approvedBy") as string) ?? "",
				isReturnable: gatepassType === "Returnable",
				expectedReturnDate: oContext.getProperty("expectedReturnDate") as string,
				carrierType: "",
				transporterName: "",
				driverName: "",
				driverContact: "",
				driverLicense: "",
				vehicleNumber: "",
				entryWeight: entryWeight != null ? String(entryWeight) : "",
				exitWeight: exitWeight != null ? String(exitWeight) : "",
				netWeight: this.formatNetWeight(entryWeight, exitWeight),
				hasWeights,
				exitGateId: ((this.getView()!.getModel("gates") as JSONModel).getData() as GateItem[])[0]?.ID ?? "",
				passPath: oContext.getPath(),
				items: []
			};

			const vehicleId = oContext.getProperty("vehicle_ID") as string | null;
			if (vehicleId) {
				try {
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
				} catch { /* vehicle data unavailable */ }
			}

			const driverId = oContext.getProperty("driver_ID") as string | null;
			if (driverId) {
				try {
					const dBinding = oModel.bindContext(`/Drivers('${driverId}')`);
					const dCtx = await dBinding.requestObject();
					if (dCtx) {
						const d = dCtx as Record<string, unknown>;
						detail.driverName = (d.name as string) ?? "";
						detail.driverContact = (d.contactNumber as string) ?? "";
						detail.driverLicense = (d.licenseNumber as string) ?? "";
					}
					dBinding.destroy();
				} catch { /* driver data unavailable */ }
			}

			const itemsBinding = oModel.bindList(`${oContext.getPath()}/items`);
			const itemContexts = await itemsBinding.requestContexts();
			detail.items = itemContexts.map(ctx => ({
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

			const oDialog = await this.getDetailDialog();
			oDialog.setModel(new JSONModel(detail), "detail");
			oDialog.open();

			const combo = `${processType}_${gatepassType}`;
			if (detail.items.length && ITEM_COLUMNS[combo]) {
				this.buildItemsTable(combo);
			}
		} catch (err: unknown) {
			MessageBox.error(this.extractErrorMessage(err));
		}
	}

	private buildItemsTable(combo: string): void {
		const columns = ITEM_COLUMNS[combo];
		if (!columns) return;

		const oTable = this.byId("itemsTable") as Table;
		oTable.destroyColumns();
		oTable.unbindItems();

		for (const col of columns) {
			oTable.addColumn(new Column({
				header: new Text({ text: this.getResourceText(col.labelKey) })
			}));
		}

		oTable.bindItems({
			path: "detail>/items",
			template: new ColumnListItem({
				cells: columns.map(col => {
					if (col.showUnit) {
						return new Text({
							text: {
								parts: [{ path: `detail>${col.property}` }, { path: "detail>unitOfMeasurement" }],
								formatter: (qty: number | null, uom: string | null) => {
									if (qty == null) return "";
									return uom ? `${qty} ${uom}` : String(qty);
								}
							} as object
						});
					}
					return new Text({ text: `{detail>${col.property}}` });
				})
			})
		});
	}

	public async onCloseDetailDialog(): Promise<void> {
		const oDialog = await this.getDetailDialog();
		oDialog.close();
	}

	public async onPerformExit(): Promise<void> {
		const oTable = this.byId("passesTable") as Table;
		const aSelectedItems = oTable.getSelectedItems();
		if (!aSelectedItems.length) {
			MessageBox.error(this.getResourceText("noSelection"));
			return;
		}

		const oModel = this.getView()!.getModel() as ODataModel;
		let successCount = 0;
		const errors: string[] = [];

		for (const item of aSelectedItems) {
			const oContext = item.getBindingContext()!;
			const gateSelect = (item as ColumnListItem).getCells()[7] as Select;
			const exitGateId = gateSelect.getSelectedKey();

			if (!exitGateId) {
				errors.push(this.getResourceText("exitGateRequired"));
				continue;
			}

			try {
				const oAction = oModel.bindContext(`${oContext.getPath()}/GatepassService.performExit(...)`);
				oAction.setParameter("exitGate", exitGateId);
				await oAction.execute();
				oAction.destroy();
				successCount++;
			} catch (err: unknown) {
				errors.push(this.extractErrorMessage(err));
			}
		}

		if (successCount > 0) MessageToast.show(this.getResourceText("exitSuccess"));
		if (errors.length) MessageBox.error(errors.join("\n"));
		this.onRefreshTable();
		oTable.removeSelections(true);
	}

	public async onPerformExitFromDialog(): Promise<void> {
		const oDialog = await this.getDetailDialog();
		const oDetailModel = oDialog.getModel("detail") as JSONModel;
		const sPath = oDetailModel.getProperty("/passPath") as string;
		const exitGateId = oDetailModel.getProperty("/exitGateId") as string;

		if (!exitGateId) {
			MessageBox.error(this.getResourceText("exitGateRequired"));
			return;
		}

		try {
			const oModel = this.getView()!.getModel() as ODataModel;
			const oAction = oModel.bindContext(`${sPath}/GatepassService.performExit(...)`);
			oAction.setParameter("exitGate", exitGateId);
			await oAction.execute();
			oAction.destroy();
			MessageToast.show(this.getResourceText("exitSuccess"));
			this.onCloseDetailDialog();
			this.onRefreshTable();
		} catch (err: unknown) {
			MessageBox.error(this.extractErrorMessage(err));
		}
	}

	public async onPrint(): Promise<void> {
		const oTable = this.byId("passesTable") as Table;
		const aSelectedItems = oTable.getSelectedItems();
		if (!aSelectedItems.length) {
			MessageBox.error(this.getResourceText("noSelection"));
			return;
		}

		const oModel = this.getView()!.getModel() as ODataModel;

		for (const item of aSelectedItems) {
			const oContext = item.getBindingContext()!;
			try {
				const oAction = oModel.bindContext(`${oContext.getPath()}/GatepassService.printPass(...)`);
				await oAction.execute();
				const html = (oAction.getBoundContext().getObject() as Record<string, unknown>).value as string;
				oAction.destroy();
				const printWindow = window.open("", "_blank");
				if (printWindow) {
					printWindow.document.write(html);
					printWindow.document.close();
				}
			} catch (err: unknown) {
				MessageBox.error(this.extractErrorMessage(err));
			}
		}
	}
}
