import BaseController from "mgatepass/approval/controller/BaseController";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import JSONModel from "sap/ui/model/json/JSONModel";
import Fragment from "sap/ui/core/Fragment";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import MDialog from "sap/m/Dialog";
import TextArea from "sap/m/TextArea";
import MButton from "sap/m/Button";
import VBox from "sap/m/VBox";
import Label from "sap/m/Label";
import Column from "sap/m/Column";
import ColumnListItem from "sap/m/ColumnListItem";
import Text from "sap/m/Text";
import type Dialog from "sap/m/Dialog";
import type Button from "sap/m/Button";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type Table from "sap/m/Table";
import type DateRangeSelection from "sap/m/DateRangeSelection";
import type Input from "sap/m/Input";
import type Event from "sap/ui/base/Event";
import formatter from "mgatepass/approval/model/formatter";

interface ColumnDef {
	labelKey: string;
	property: string;
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
}

const ITEM_COLUMNS: Record<string, ColumnDef[]> = {
	Inward_NonReturnable: [
		{ labelKey: "colDocNumber", property: "documentNumber" },
		{ labelKey: "colLineItem", property: "lineItem" },
		{ labelKey: "colMaterialCode", property: "materialCode" },
		{ labelKey: "colMaterialDesc", property: "materialDescription" },
		{ labelKey: "colPartyName", property: "partyName" },
		{ labelKey: "colOrderQty", property: "orderQuantity" },
		{ labelKey: "colOpenQty", property: "openQuantity" },
		{ labelKey: "colReceivedQty", property: "receivedQuantity" }
	],
	Outward_NonReturnable: [
		{ labelKey: "colDocNumber", property: "documentNumber" },
		{ labelKey: "colLineItem", property: "lineItem" },
		{ labelKey: "colMaterialCode", property: "materialCode" },
		{ labelKey: "colMaterialDesc", property: "materialDescription" },
		{ labelKey: "colPartyName", property: "partyName" },
		{ labelKey: "colBillingQty", property: "orderQuantity" },
		{ labelKey: "colIssueQty", property: "issueQuantity" }
	],
	Inward_Returnable: [
		{ labelKey: "colDocNumber", property: "documentNumber" },
		{ labelKey: "colLineItem", property: "lineItem" },
		{ labelKey: "colPurchaseOrder", property: "purchaseOrder" },
		{ labelKey: "colMaterialCode", property: "materialCode" },
		{ labelKey: "colMaterialDesc", property: "materialDescription" },
		{ labelKey: "colPartyName", property: "partyName" },
		{ labelKey: "colChallanQty", property: "orderQuantity" },
		{ labelKey: "colReceivedQty", property: "receivedQuantity" }
	],
	Outward_Returnable: [
		{ labelKey: "colDocNumber", property: "documentNumber" },
		{ labelKey: "colLineItem", property: "lineItem" },
		{ labelKey: "colMaterialCode", property: "materialCode" },
		{ labelKey: "colMaterialDesc", property: "materialDescription" },
		{ labelKey: "colPartyName", property: "partyName" },
		{ labelKey: "colChallanQty", property: "orderQuantity" },
		{ labelKey: "colIssueQty", property: "issueQuantity" }
	],
	Inward_AgainstOutwardRGP: [
		{ labelKey: "colDocNumber", property: "documentNumber" },
		{ labelKey: "colLineItem", property: "lineItem" },
		{ labelKey: "colMaterialCode", property: "materialCode" },
		{ labelKey: "colMaterialDesc", property: "materialDescription" },
		{ labelKey: "colPartyName", property: "partyName" },
		{ labelKey: "colChallanQty", property: "orderQuantity" },
		{ labelKey: "colReceivedQty", property: "receivedQuantity" }
	],
	Outward_AgainstInwardRGP: [
		{ labelKey: "colDocNumber", property: "documentNumber" },
		{ labelKey: "colLineItem", property: "lineItem" },
		{ labelKey: "colPurchaseOrder", property: "purchaseOrder" },
		{ labelKey: "colMaterialCode", property: "materialCode" },
		{ labelKey: "colMaterialDesc", property: "materialDescription" },
		{ labelKey: "colPartyName", property: "partyName" },
		{ labelKey: "colChallanQty", property: "orderQuantity" },
		{ labelKey: "colIssueQty", property: "issueQuantity" }
	]
};

interface DetailData {
	passNumber: string;
	createdAt: string;
	createdBy: string;
	processType: string;
	gatepassType: string;
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
	items: ItemData[];
}

/**
 * @namespace mgatepass.approval.controller
 */
export default class AppController extends BaseController {

	private _pDetailDialog: Promise<Dialog> | null = null;

	public override onInit(): void {
		this.initResourceBundle();
		this.applyFilters();
	}

	public applyFilters(): void {
		const oTable = this.byId("passesTable") as Table;
		const oBinding = oTable?.getBinding("items") as ODataListBinding;
		if (!oBinding) return;

		const aFilters: Filter[] = [];

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

		oBinding.filter(aFilters.length ? aFilters : []);
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
		try {
			const oContext = (oEvent.getSource() as Button).getBindingContext()!;
			const oModel = this.getView()!.getModel() as ODataModel;
			const gatepassType = oContext.getProperty("gatepassType") as string;

			const rawDocs = await (oContext as any).requestObject("documents") as unknown;

			const processType = oContext.getProperty("processType") as string;
			const detail: DetailData = {
				passNumber: oContext.getProperty("passNumber") as string,
				createdAt: oContext.getProperty("createdAt") as string,
				createdBy: oContext.getProperty("createdBy") as string,
				processType,
				gatepassType,
				documents: formatter.formatDocuments(rawDocs),
				weighbridgeRequired: oContext.getProperty("weighbridgeRequired") as boolean,
				isReturnable: gatepassType === "Returnable",
				expectedReturnDate: oContext.getProperty("expectedReturnDate") as string,
				carrierType: "",
				transporterName: "",
				driverName: "",
				driverContact: "",
				driverLicense: "",
				vehicleNumber: "",
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
				purchaseOrder: ctx.getProperty("purchaseOrder") as string | null
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
			MessageBox.error(err instanceof Error ? err.message : "Failed to load gatepass details.");
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
				cells: columns.map(col =>
					new Text({ text: `{detail>${col.property}}` })
				)
			})
		});
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

		this.showApproveDialog(async (sRemarks: string | null) => {
			const aPaths = aSelectedItems.map(item => item.getBindingContext()!.getPath());
			await this.executeBulkAction(aPaths, "approvePass", sRemarks);
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
		this.showApproveDialog(async (sRemarks: string | null) => {
			const oDetailModel = (await this.getDetailDialog()).getModel("detail") as JSONModel;
			const sPath = oDetailModel.getProperty("/passPath") as string;
			await this.executeAction(sPath, "approvePass", sRemarks);
			this.onCloseDetailDialog();
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

	private showApproveDialog(fnCallback: (remarks: string | null) => Promise<void>): void {
		const oTextArea = new TextArea({ width: "100%", rows: 3, placeholder: this.getResourceText("remarksOptional") });
		const oDialog = new MDialog({
			title: this.getResourceText("approveDialogTitle"),
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
				text: this.getResourceText("approve"),
				type: "Accept",
				press: async () => {
					oDialog.close();
					const sRemarks = oTextArea.getValue().trim();
					await fnCallback(sRemarks || null);
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
