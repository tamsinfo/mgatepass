import BaseController from "mgatepass/weighbridge/controller/BaseController";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import JSONModel from "sap/ui/model/json/JSONModel";
import Fragment from "sap/ui/core/Fragment";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import type Dialog from "sap/m/Dialog";
import type Button from "sap/m/Button";
import type Input from "sap/m/Input";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type Table from "sap/m/Table";
import type ColumnListItem from "sap/m/ColumnListItem";
import type DateRangeSelection from "sap/m/DateRangeSelection";
import type Event from "sap/ui/base/Event";

const GATEPASS_TYPE_LABELS: Record<string, string> = {
	Returnable: "Returnable",
	NonReturnable: "Non-Returnable",
	AgainstOutwardRGP: "Against Outward RGP",
	AgainstInwardRGP: "Against Inward RGP"
};

const WEIGHT_STATUSES = ["EntryWeightPending", "ExitWeightPending"];

interface DetailData {
	passNumber: string;
	createdAt: string;
	createdBy: string;
	processType: string;
	gatepassTypeFormatted: string;
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
	status: string;
	passPath: string;
}

/**
 * @namespace mgatepass.weighbridge.controller
 */
export default class AppController extends BaseController {

	private _pDetailDialog: Promise<Dialog> | null = null;

	public override onInit(): void {
		this.initResourceBundle();
		this.getView()!.setModel(new JSONModel({ weightUnit: "" }), "config");
		this.loadAppConfig();
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

	public applyFilters(): void {
		const oTable = this.byId("passesTable") as Table;
		const oBinding = oTable?.getBinding("items") as ODataListBinding;
		if (!oBinding) return;

		const aFilters: Filter[] = [];

		aFilters.push(new Filter({
			filters: WEIGHT_STATUSES.map(s => new Filter("status", FilterOperator.EQ, s)),
			and: false
		}));

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
		if (oBinding) oBinding.refresh();
	}

	private async getDetailDialog(): Promise<Dialog> {
		if (!this._pDetailDialog) {
			this._pDetailDialog = Fragment.load({
				id: this.getView()!.getId(),
				name: "mgatepass.weighbridge.fragment.DetailDialog",
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

			const detail: DetailData = {
				passNumber: oContext.getProperty("passNumber") as string,
				createdAt: oContext.getProperty("createdAt") as string,
				createdBy: oContext.getProperty("createdBy") as string,
				processType: oContext.getProperty("processType") as string,
				gatepassTypeFormatted: GATEPASS_TYPE_LABELS[gatepassType] ?? gatepassType,
				documents: this.formatDocuments(rawDocs),
				approvedAt: (oContext.getProperty("approvedAt") as string) ?? "",
				approvedBy: (oContext.getProperty("approvedBy") as string) ?? "",
				isReturnable: gatepassType === "Returnable",
				expectedReturnDate: (oContext.getProperty("expectedReturnDate") as string) ?? "",
				carrierType: "",
				transporterName: "",
				driverName: "",
				driverContact: "",
				driverLicense: "",
				vehicleNumber: "",
				entryWeight: entryWeight != null ? String(entryWeight) : "",
				exitWeight: exitWeight != null ? String(exitWeight) : "",
				netWeight: this.formatNetWeight(entryWeight, exitWeight),
				status: oContext.getProperty("status") as string,
				passPath: oContext.getPath()
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

			const oDialog = await this.getDetailDialog();
			oDialog.setModel(new JSONModel(detail), "detail");
			oDialog.open();
		} catch (err: unknown) {
			MessageBox.error(err instanceof Error ? err.message : "Failed to load gatepass details.");
		}
	}

	public async onCloseDetailDialog(): Promise<void> {
		const oDialog = await this.getDetailDialog();
		oDialog.close();
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

	public async onSaveWeights(): Promise<void> {
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
			const status = oContext.getProperty("status") as string;
			if (status !== "EntryWeightPending" && status !== "ExitWeightPending") continue;

			const entryInput = (item as ColumnListItem).getCells()[4] as Input;
			const exitInput = (item as ColumnListItem).getCells()[5] as Input;
			const entryVal = parseFloat(entryInput.getValue());
			const exitVal = parseFloat(exitInput.getValue());

			try {
				const oAction = oModel.bindContext(`${oContext.getPath()}/GatepassService.saveWeights(...)`);
				if (!isNaN(entryVal)) oAction.setParameter("entryWeight", entryVal);
				if (!isNaN(exitVal)) oAction.setParameter("exitWeight", exitVal);
				await oAction.execute();
				oAction.destroy();
				successCount++;
			} catch (err: unknown) {
				errors.push(this.extractErrorMessage(err));
			}
		}

		if (successCount > 0) MessageToast.show(this.getResourceText("saveWeightsSuccess"));
		if (errors.length) MessageBox.error(errors.join("\n"));
		this.onRefreshTable();
		oTable.removeSelections(true);
	}

	public async onFinaliseEntryWeight(): Promise<void> {
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
			if (oContext.getProperty("status") !== "EntryWeightPending") continue;

			const weightInput = (item as ColumnListItem).getCells()[4] as Input;
			const weight = parseFloat(weightInput.getValue());
			if (isNaN(weight) || weight <= 0) {
				errors.push(this.getResourceText("invalidWeight"));
				continue;
			}

			try {
				const oAction = oModel.bindContext(`${oContext.getPath()}/GatepassService.finaliseEntryWeight(...)`);
				oAction.setParameter("entryWeight", weight);
				await oAction.execute();
				oAction.destroy();
				successCount++;
			} catch (err: unknown) {
				errors.push(this.extractErrorMessage(err));
			}
		}

		if (successCount > 0) MessageToast.show(this.getResourceText("entryWeightSuccess"));
		if (errors.length) MessageBox.error(errors.join("\n"));
		this.onRefreshTable();
		oTable.removeSelections(true);
	}

	public async onFinaliseExitWeight(): Promise<void> {
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
			if (oContext.getProperty("status") !== "ExitWeightPending") continue;

			const weightInput = (item as ColumnListItem).getCells()[5] as Input;
			const weight = parseFloat(weightInput.getValue());
			if (isNaN(weight) || weight <= 0) {
				errors.push(this.getResourceText("invalidWeight"));
				continue;
			}

			try {
				const oAction = oModel.bindContext(`${oContext.getPath()}/GatepassService.finaliseExitWeight(...)`);
				oAction.setParameter("exitWeight", weight);
				await oAction.execute();
				oAction.destroy();
				successCount++;
			} catch (err: unknown) {
				errors.push(this.extractErrorMessage(err));
			}
		}

		if (successCount > 0) MessageToast.show(this.getResourceText("exitWeightSuccess"));
		if (errors.length) MessageBox.error(errors.join("\n"));
		this.onRefreshTable();
		oTable.removeSelections(true);
	}

	public async onSaveWeightsFromDialog(): Promise<void> {
		const oDialog = await this.getDetailDialog();
		const oDetailModel = oDialog.getModel("detail") as JSONModel;
		const sPath = oDetailModel.getProperty("/passPath") as string;
		const entryVal = parseFloat(oDetailModel.getProperty("/entryWeight") as string);
		const exitVal = parseFloat(oDetailModel.getProperty("/exitWeight") as string);

		try {
			const oModel = this.getView()!.getModel() as ODataModel;
			const oAction = oModel.bindContext(`${sPath}/GatepassService.saveWeights(...)`);
			if (!isNaN(entryVal)) oAction.setParameter("entryWeight", entryVal);
			if (!isNaN(exitVal)) oAction.setParameter("exitWeight", exitVal);
			await oAction.execute();
			oAction.destroy();
			MessageToast.show(this.getResourceText("saveWeightsSuccess"));
			this.onRefreshTable();
		} catch (err: unknown) {
			MessageBox.error(this.extractErrorMessage(err));
		}
	}

	public async onFinaliseEntryWeightFromDialog(): Promise<void> {
		const oDialog = await this.getDetailDialog();
		const oDetailModel = oDialog.getModel("detail") as JSONModel;
		const sPath = oDetailModel.getProperty("/passPath") as string;
		const weight = parseFloat(oDetailModel.getProperty("/entryWeight") as string);

		if (isNaN(weight) || weight <= 0) {
			MessageBox.error(this.getResourceText("invalidWeight"));
			return;
		}

		try {
			const oModel = this.getView()!.getModel() as ODataModel;
			const oAction = oModel.bindContext(`${sPath}/GatepassService.finaliseEntryWeight(...)`);
			oAction.setParameter("entryWeight", weight);
			await oAction.execute();
			oAction.destroy();
			MessageToast.show(this.getResourceText("entryWeightSuccess"));
			this.onCloseDetailDialog();
			this.onRefreshTable();
		} catch (err: unknown) {
			MessageBox.error(this.extractErrorMessage(err));
		}
	}

	public async onFinaliseExitWeightFromDialog(): Promise<void> {
		const oDialog = await this.getDetailDialog();
		const oDetailModel = oDialog.getModel("detail") as JSONModel;
		const sPath = oDetailModel.getProperty("/passPath") as string;
		const weight = parseFloat(oDetailModel.getProperty("/exitWeight") as string);

		if (isNaN(weight) || weight <= 0) {
			MessageBox.error(this.getResourceText("invalidWeight"));
			return;
		}

		try {
			const oModel = this.getView()!.getModel() as ODataModel;
			const oAction = oModel.bindContext(`${sPath}/GatepassService.finaliseExitWeight(...)`);
			oAction.setParameter("exitWeight", weight);
			await oAction.execute();
			oAction.destroy();
			MessageToast.show(this.getResourceText("exitWeightSuccess"));
			this.onCloseDetailDialog();
			this.onRefreshTable();
		} catch (err: unknown) {
			MessageBox.error(this.extractErrorMessage(err));
		}
	}

	public onPrint(): void {
		MessageToast.show("Print functionality coming soon.");
	}
}
