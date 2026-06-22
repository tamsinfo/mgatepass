import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Handlebars from 'handlebars'
import type { Pass } from '#cds-models/GatepassService'

const templateSource = readFileSync(resolve(__dirname, 'templates/print-slip.hbs'), 'utf-8')

Handlebars.registerHelper('val', (v: unknown) => {
    if (v == null || v === '') return '—'
    return String(v)
})

Handlebars.registerHelper('yesNo', (v: unknown) => v ? 'Yes' : 'No')

const template = Handlebars.compile(templateSource)

const GATEPASS_TYPE_LABELS: Record<string, string> = {
    Returnable: 'Returnable',
    NonReturnable: 'Non-Returnable',
    AgainstOutwardRGP: 'Against Outward RGP',
    AgainstInwardRGP: 'Against Inward RGP'
}

const STATUS_LABELS: Record<string, string> = {
    Draft: 'Draft',
    PendingApproval: 'Pending Approval',
    Rejected: 'Rejected',
    Cancelled: 'Cancelled',
    EntryWeightPending: 'Entry Weight Pending',
    ExitWeightPending: 'Exit Weight Pending',
    GateExitPending: 'Gate Exit Pending',
    Completed: 'Completed',
    PartiallyReturned: 'Partially Returned',
    Returned: 'Returned'
}

const STATUS_COLORS: Record<string, string> = {
    Draft: '#6c757d',
    PendingApproval: '#e67e22',
    Rejected: '#e74c3c',
    Cancelled: '#95a5a6',
    EntryWeightPending: '#e67e22',
    ExitWeightPending: '#e67e22',
    GateExitPending: '#3498db',
    Completed: '#27ae60',
    PartiallyReturned: '#3498db',
    Returned: '#27ae60'
}

function fmtWeight(w: number | null | undefined): string {
    if (w == null) return '—'
    return Number(w).toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
}

function fmtDateTime(d: string | null | undefined): string {
    if (!d) return '—'
    try {
        return new Date(d).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        })
    } catch {
        return d
    }
}

function fmtDate(d: string | null | undefined): string {
    if (!d) return ''
    try {
        return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
        return d
    }
}

interface PrintData {
    pass: Pass
    vehicle: Record<string, unknown> | null
    vehicleType: Record<string, unknown> | null
    driver: Record<string, unknown> | null
    weight: Record<string, unknown> | null
    entryGate: Record<string, unknown> | null
    exitGate: Record<string, unknown> | null
    companyLogo: string | null
    weightUnit: string
    partyName: string | null
}

export function buildPrintSlipHtml(data: PrintData): string {
    const { pass, vehicle, vehicleType, driver, weight, entryGate, exitGate, companyLogo, weightUnit, partyName } = data
    const p = pass as unknown as Record<string, unknown>

    const entryWeight = weight?.entryWeight as number | null
    const exitWeight = weight?.exitWeight as number | null
    const netWeight = entryWeight != null && exitWeight != null ? Math.abs(exitWeight - entryWeight) : null

    const qrData = encodeURIComponent(JSON.stringify({
        passNumber: pass.passNumber,
        status: pass.status,
        processType: pass.processType,
        gatepassType: pass.gatepassType,
        documents: pass.documents,
        vehicleType: vehicleType?.name ?? null,
        vehicleNumber: vehicle?.vehicleNumber ?? null,
        transporter: vehicle?.transporter ?? null,
        driverName: driver?.name ?? null,
        driverLicense: driver?.licenseNumber ?? null,
        driverContact: driver?.contactNumber ?? null,
        entryWeight: entryWeight,
        exitWeight: exitWeight,
        netWeight: netWeight,
        weighbridgeApplicable: pass.weighbridgeRequired ?? false
    }))

    const docs = pass.documents as unknown
    let documentsStr = ''
    if (Array.isArray(docs)) {
        documentsStr = docs.map((d: unknown) => typeof d === 'object' && d !== null ? (d as Record<string, unknown>).value : d).filter(Boolean).join(', ')
    } else if (typeof docs === 'string') {
        documentsStr = docs
    }

    const context = {
        passNumber: pass.passNumber,
        statusLabel: STATUS_LABELS[pass.status!] ?? pass.status,
        statusColor: STATUS_COLORS[pass.status!] ?? '#6c757d',
        createdAt: fmtDateTime(p.createdAt as string),
        processType: pass.processType,
        gatepassTypeLabel: GATEPASS_TYPE_LABELS[pass.gatepassType!] ?? pass.gatepassType,
        documentType: pass.documentType,
        weighbridgeRequired: pass.weighbridgeRequired,
        documents: documentsStr,
        expectedReturnDate: fmtDate(p.expectedReturnDate as string),
        approvedBy: p.approvedBy as string,
        approvedAt: fmtDateTime(p.approvedAt as string),
        entryGate: entryGate?.name as string | null,
        exitGate: exitGate?.name as string | null,
        vehicleType: vehicleType?.name as string | null,
        vehicleNumber: vehicle?.vehicleNumber as string | null,
        transporter: vehicle?.transporter as string | null,
        driverName: driver?.name as string | null,
        driverLicense: driver?.licenseNumber as string | null,
        driverContact: driver?.contactNumber as string | null,
        showWeighbridge: pass.weighbridgeRequired,
        weightUnit: weightUnit || 'kg',
        entryWeightFormatted: fmtWeight(entryWeight),
        exitWeightFormatted: fmtWeight(exitWeight),
        netWeightFormatted: fmtWeight(netWeight),
        hasEntryWeight: entryWeight != null,
        hasExitWeight: exitWeight != null,
        hasNetWeight: netWeight != null,
        partyLabel: pass.processType === 'Outward' ? 'Customer' : 'Supplier',
        partyName,
        companyLogo,
        qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=128x128&ecc=L&data=${qrData}`,
        printedAt: new Date().toLocaleString('en-IN')
    }

    return template(context)
}
