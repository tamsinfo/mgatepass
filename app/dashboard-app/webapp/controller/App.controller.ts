import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import MessageBox from "sap/m/MessageBox";
import Fragment from "sap/ui/core/Fragment";
import type Table from "sap/m/Table";
import type Dialog from "sap/m/Dialog";
import type IconTabBar from "sap/m/IconTabBar";
import type Button from "sap/m/Button";
import type ColumnListItem from "sap/m/ColumnListItem";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import JSONModel from "sap/ui/model/json/JSONModel";

import BaseController from "mgatepass/dashboard/controller/BaseController";

/**
 * @namespace mgatepass.dashboard.controller
 */
export default class AppController extends BaseController {

	private _pDetailDialog: Promise<Dialog> | null = null;

	public override onInit(): void {
		this.initResourceBundle();

		const tabCountsModel = new JSONModel({
			All: 0,
			Draft: 0,
			PendingApproval: 0,
			Rejected: 0,
			Cancelled: 0,
			EntryWeightPending: 0,
			ExitWeightPending: 0,
			GateExitPending: 0,
			Completed: 0,
			PartiallyReturned: 0,
			Returned: 0
		});
		this.getView()!.setModel(tabCountsModel, "tabCounts");

		this.loadTabCounts();
	}

	public onTabSelect(): void {
		this.applyStatusFilter();
	}

	public onRefreshTable(): void {
		this.applyStatusFilter();
		this.loadTabCounts();
	}

	private applyStatusFilter(): void {
		const oTable = this.byId("passesTable") as Table;
		const oTabBar = this.byId("statusTabs") as IconTabBar;
		const sKey = oTabBar.getSelectedKey();
		const oBinding = oTable.getBinding("items") as ODataListBinding;

		if (!oBinding) return;

		if (sKey === "All") {
			oBinding.filter([]);
		} else {
			oBinding.filter([new Filter("status", FilterOperator.EQ, sKey)]);
		}
	}

	public async onRowPress(oEvent: { getSource: () => ColumnListItem }): Promise<void> {
		const oItem = oEvent.getSource();
		const sPath = oItem.getBindingContext()!.getPath();

		if (!this._pDetailDialog) {
			this._pDetailDialog = Fragment.load({
				id: this.getView()!.getId(),
				name: "mgatepass.dashboard.fragment.GatepassDetail",
				controller: this
			}).then((oDialog) => {
				const dialog = oDialog as Dialog;
				this.getView()!.addDependent(dialog);
				return dialog;
			});
		}

		const oDialog = await this._pDetailDialog;
		oDialog.bindElement({
			path: sPath,
			parameters: {
				$expand: "items,auditLog,vehicle($expand=type),driver,weight,entryGate,exitGate"
			}
		});
		oDialog.open();
	}

	public onCloseDetailDialog(): void {
		const oDialog = this.byId("detailDialog") as Dialog;
		oDialog.close();
	}

	public async onPrint(oEvent: { getSource: () => Button }): Promise<void> {
		const oButton = oEvent.getSource();
		const oContext = oButton.getBindingContext()!;
		const oModel = this.getView()!.getModel() as ODataModel;

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

	private extractErrorMessage(err: unknown): string {
		if (err instanceof Error) return err.message;
		if (typeof err === "string") return err;
		return "An unexpected error occurred";
	}

	private async loadTabCounts(): Promise<void> {
		const tabCounts = this.getView()!.getModel("tabCounts") as JSONModel;

		const statuses = [
			"Draft", "PendingApproval", "Rejected", "Cancelled",
			"EntryWeightPending", "ExitWeightPending", "GateExitPending",
			"Completed", "PartiallyReturned", "Returned"
		];

		try {
			const base = "/odata/v4/gatepass/";
			const allResp = await fetch(`${base}Passes/$count`);
			tabCounts.setProperty("/All", parseInt(await allResp.text()) || 0);

			await Promise.all(statuses.map(async (status) => {
				const resp = await fetch(`${base}Passes/$count?$filter=status eq '${status}'`);
				tabCounts.setProperty(`/${status}`, parseInt(await resp.text()) || 0);
			}));
		} catch {
			// counts remain at 0
		}
	}
}
