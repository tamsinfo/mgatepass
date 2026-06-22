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
	formatDateTime(value: string): string {
		if (!value) return "";
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

	formatDocuments(aDocuments: unknown): string {
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
};
