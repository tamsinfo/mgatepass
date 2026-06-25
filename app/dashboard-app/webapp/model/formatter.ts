const AUDIT_ACTION_LABELS: Record<string, string> = {
	Created: "Created",
	SentForApproval: "Sent for Approval",
	Approved: "Approved",
	Rejected: "Rejected",
	Cancelled: "Cancelled",
	WeightRecorded: "Weight Recorded",
	EntryPerformed: "Entry Performed",
	ExitPerformed: "Exit Performed",
	Updated: "Updated",
	Finalised: "Finalised",
	Printed: "Printed"
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
	PurchaseOrder: "Purchase Order",
	BillingDocument: "Billing Document",
	ManualEntry: "Manual Entry",
	Gatepass: "Gatepass"
};

const GATEPASS_TYPE_LABELS: Record<string, string> = {
	Returnable: "Returnable",
	NonReturnable: "Non-Returnable",
	AgainstOutwardRGP: "Against Outward RGP",
	AgainstInwardRGP: "Against Inward RGP"
};

const STATUS_LABELS: Record<string, string> = {
	Draft: "Draft",
	PendingApproval: "Pending Approval",
	Rejected: "Rejected",
	Cancelled: "Cancelled",
	EntryWeightPending: "Entry Weight Pending",
	ExitWeightPending: "Exit Weight Pending",
	GateExitPending: "Gate Exit Pending",
	Completed: "Completed",
	PartiallyReturned: "Partially Returned",
	Returned: "Returned"
};

export default {
	formatValue(value: unknown): string {
		if (value == null || value === "") return "N/A";
		return String(value);
	},

	formatDateTime(value: string): string {
		if (!value) return "N/A";
		try {
			return new Date(value).toLocaleString("en-IN", {
				day: "2-digit", month: "short", year: "numeric",
				hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
			});
		} catch {
			return value;
		}
	},

	formatGatepassType(value: string): string {
		return GATEPASS_TYPE_LABELS[value] ?? value ?? "";
	},

	formatStatus(value: string): string {
		return STATUS_LABELS[value] ?? value ?? "";
	},

	formatReturnDelay(gatepassType: string, expectedReturnDate: string): string {
		if (gatepassType !== "Returnable") return "";
		if (!expectedReturnDate) return "";
		const expected = new Date(expectedReturnDate);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		expected.setHours(0, 0, 0, 0);
		const diffMs = today.getTime() - expected.getTime();
		const days = Math.max(0, Math.floor(diffMs / 86400000));
		return `${days} day${days !== 1 ? "s" : ""}`;
	},

	formatReturnDelayState(gatepassType: string, expectedReturnDate: string): string {
		if (gatepassType !== "Returnable" || !expectedReturnDate) return "None";
		const expected = new Date(expectedReturnDate);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		expected.setHours(0, 0, 0, 0);
		return today > expected ? "Error" : "None";
	},

	formatAuditAction(value: string): string {
		return AUDIT_ACTION_LABELS[value] ?? value ?? "N/A";
	},

	formatDocumentType(value: string): string {
		return DOCUMENT_TYPE_LABELS[value] ?? value ?? "N/A";
	},

	formatYesNo(value: boolean): string {
		return value ? "Yes" : "No";
	},

	formatDate(value: string): string {
		if (!value) return "N/A";
		try {
			return new Date(value).toLocaleDateString("en-IN", {
				day: "2-digit", month: "short", year: "numeric"
			});
		} catch {
			return value;
		}
	},

	formatWeight(value: unknown): string {
		if (value == null) return "N/A";
		return Number(value).toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
	},

	formatDocuments(aDocuments: unknown): string {
		if (!aDocuments) return "N/A";
		if (typeof aDocuments === "string") return aDocuments;
		if (Array.isArray(aDocuments)) {
			return aDocuments
				.map((d: unknown) => (typeof d === "object" && d !== null) ? (d as Record<string, unknown>).value : d)
				.filter(Boolean)
				.join(", ");
		}
		return String(aDocuments);
	}
};
