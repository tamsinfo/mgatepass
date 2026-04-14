import BaseController from "mgatepass/entry/controller/BaseController";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import JSONModel from "sap/ui/model/json/JSONModel";
import Dialog from "sap/m/Dialog";
import TextArea from "sap/m/TextArea";
import Button from "sap/m/Button";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type Table from "sap/m/Table";
import type DateRangeSelection from "sap/m/DateRangeSelection";
import type Input from "sap/m/Input";
import type Event from "sap/ui/base/Event";

/**
 * @namespace mgatepass.entry.controller
 */
export default class AppController extends BaseController {

	public onInit(): void {
		this.loadApprovalRules();
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

	public onCreateGatepass(): void {
		// will be wired to create flow
	}

	public onEditPass(_oEvent: Event): void {
		// will be wired to edit flow
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
		const oDialog = new Dialog({
			title: this.getResourceText("cancelDialogTitle"),
			type: "Message",
			content: [oTextArea],
			beginButton: new Button({
				text: this.getResourceText("confirm"),
				type: "Emphasized",
				press: async () => {
					const sRemarks = oTextArea.getValue().trim();
					if (!sRemarks) {
						MessageBox.error(this.getResourceText("cancelRemarksRequired"));
						return;
					}
					oDialog.close();
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
			endButton: new Button({
				text: this.getResourceText("close"),
				press: () => oDialog.close()
			}),
			afterClose: () => oDialog.destroy()
		});
		oDialog.open();
	}
}
