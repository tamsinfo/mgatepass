const GATEPASS_TYPE_LABELS: Record<string, string> = {
	Returnable: "Returnable",
	NonReturnable: "Non-Returnable",
	AgainstOutwardRGP: "Against Outward RGP",
	AgainstInwardRGP: "Against Inward RGP"
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
	}
};
