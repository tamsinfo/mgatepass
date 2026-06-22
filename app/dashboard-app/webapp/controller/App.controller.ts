import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import type Table from "sap/m/Table";
import type IconTabBar from "sap/m/IconTabBar";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import JSONModel from "sap/ui/model/json/JSONModel";

import BaseController from "mgatepass/dashboard/controller/BaseController";

/**
 * @namespace mgatepass.dashboard.controller
 */
export default class AppController extends BaseController {

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

	private async loadTabCounts(): Promise<void> {
		const oModel = this.getView()!.getModel() as ODataModel;
		const tabCounts = this.getView()!.getModel("tabCounts") as JSONModel;

		const statuses = [
			"Draft", "PendingApproval", "Rejected", "Cancelled",
			"EntryWeightPending", "ExitWeightPending", "GateExitPending",
			"Completed", "PartiallyReturned", "Returned"
		];

		try {
			const oListBinding = oModel.bindList("/Passes", undefined, undefined, undefined, {
				$count: true
			});
			await oListBinding.requestContexts(0, 0);
			const totalCount = oListBinding.getCount();
			tabCounts.setProperty("/All", totalCount);

			for (const status of statuses) {
				const oBinding = oModel.bindList("/Passes", undefined, undefined,
					[new Filter("status", FilterOperator.EQ, status)],
					{ $count: true }
				);
				await oBinding.requestContexts(0, 0);
				tabCounts.setProperty(`/${status}`, oBinding.getCount());
			}
		} catch {
			// counts remain at 0
		}
	}
}
