import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
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
	private _pExportDialog: Promise<Dialog> | null = null;

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

	public async onExportPress(): Promise<void> {
		if (!this._pExportDialog) {
			this._pExportDialog = Fragment.load({
				id: this.getView()!.getId(),
				name: "mgatepass.dashboard.fragment.ExportDialog",
				controller: this
			}).then((oDialog) => {
				const dialog = oDialog as Dialog;
				this.getView()!.addDependent(dialog);
				return dialog;
			});
		}

		const now = new Date();
		const exportModel = new JSONModel({
			month: String(now.getMonth() + 1).padStart(2, "0"),
			year: String(now.getFullYear())
		});
		this.getView()!.setModel(exportModel, "export");

		const oDialog = await this._pExportDialog;
		oDialog.open();
	}

	public async onExportSubmit(): Promise<void> {
		const exportModel = this.getView()!.getModel("export") as JSONModel;
		const month = exportModel.getProperty("/month") as string;
		const year = exportModel.getProperty("/year") as string;

		const oDialog = this.byId("exportDialog") as Dialog;
		oDialog.setBusy(true);

		try {
			const startDate = `${year}-${month}-01`;
			const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
			const endDate = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;

			const base = "/odata/v4/gatepass/";
			const filter = `$filter=createdAt ge ${startDate}T00:00:00Z and createdAt le ${endDate}T23:59:59Z`;
			const expand = "$expand=vehicle($expand=type),driver,weight,entryGate,exitGate";
			const resp = await fetch(`${base}Passes?${filter}&${expand}&$orderby=createdAt desc`);

			if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

			const data = await resp.json() as { value: Record<string, unknown>[] };
			const passes = data.value;

			if (!passes.length) {
				MessageToast.show("No passes found for selected month");
				oDialog.setBusy(false);
				return;
			}

			const csv = this.buildCsv(passes);
			const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
			const filename = `Gatepasses_${monthNames[parseInt(month) - 1]}_${year}.csv`;
			this.downloadCsv(csv, filename);
		} catch (err: unknown) {
			MessageBox.error(this.extractErrorMessage(err));
		} finally {
			oDialog.setBusy(false);
			oDialog.close();
		}
	}

	public onExportCancel(): void {
		const oDialog = this.byId("exportDialog") as Dialog;
		oDialog.close();
	}

	private buildCsv(passes: Record<string, unknown>[]): string {
		const headers = [
			"Pass Number", "Status", "Process Type", "Gatepass Type",
			"Document Type", "Documents", "Weighbridge Required", "Expected Return Date",
			"Created By", "Created At", "Approved By", "Approved At",
			"Vehicle Type", "Vehicle Number", "Transporter",
			"Driver Name", "Driver License", "Driver Contact",
			"Entry Gate", "Exit Gate",
			"Entry Weight", "Exit Weight"
		];

		const rows: string[][] = [];
		const val = (v: unknown) => (v == null || v === "") ? "N/A" : String(v);

		for (const pass of passes) {
			const vehicle = pass.vehicle as Record<string, unknown> | null;
			const vehicleType = vehicle?.type as Record<string, unknown> | null;
			const driver = pass.driver as Record<string, unknown> | null;
			const weight = pass.weight as Record<string, unknown> | null;
			const entryGate = pass.entryGate as Record<string, unknown> | null;
			const exitGate = pass.exitGate as Record<string, unknown> | null;
			const docs = pass.documents as unknown;
			const docStr = Array.isArray(docs) && docs.length ? docs.join("; ") : "N/A";

			let docType = val(pass.documentType);
			if (pass.processType === "Outward" && pass.gatepassType === "Returnable") {
				docType = "Challan";
			}

			rows.push([
				val(pass.passNumber),
				val(pass.status),
				val(pass.processType),
				val(pass.gatepassType),
				docType,
				docStr,
				pass.weighbridgeRequired ? "Yes" : "No",
				val(pass.expectedReturnDate),
				val(pass.createdBy),
				pass.createdAt ? new Date(pass.createdAt as string).toLocaleString("en-IN") : "N/A",
				val(pass.approvedBy),
				pass.approvedAt ? new Date(pass.approvedAt as string).toLocaleString("en-IN") : "N/A",
				val(vehicleType?.name),
				val(vehicle?.vehicleNumber),
				val(vehicle?.transporter),
				val(driver?.name),
				val(driver?.licenseNumber),
				val(driver?.contactNumber),
				val(entryGate?.name),
				val(exitGate?.name),
				weight?.entryWeight != null ? String(weight.entryWeight) : "N/A",
				weight?.exitWeight != null ? String(weight.exitWeight) : "N/A",
			]);
		}

		const escape = (val: string) => {
			if (val.includes(",") || val.includes('"') || val.includes("\n")) {
				return `"${val.replace(/"/g, '""')}"`;
			}
			return val;
		};

		const lines = [headers.map(escape).join(",")];
		for (const row of rows) {
			lines.push(row.map(escape).join(","));
		}
		return lines.join("\r\n");
	}

	private downloadCsv(csv: string, filename: string): void {
		const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
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
