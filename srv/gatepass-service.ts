import cds from '@sap/cds'
import type { Pass, Vehicle, Driver, PassAuditLog, GatepassItem, createGatepass, fetchDocumentItems } from '#cds-models/GatepassService'
import type { DocumentType, PassStatus, AuditAction } from '#cds-models/mgatepass'
import { buildPrintSlipHtml } from './print-slip'

type CreateGatepassParams = (typeof createGatepass)['__parameters']
type FetchDocItemsParams = (typeof fetchDocumentItems)['__parameters']

interface NormalizedItem {
    lineItem: string
    documentNumber: string
    materialCode: string
    materialDescription: string
    partyName: string
    orderQuantity: number | null
    openQuantity: number | null
    purchaseOrder: string | null
    unitOfMeasurement: string | null
}

const DOCUMENT_TYPE_MAP: Record<string, DocumentType> = {
    'Inward_NonReturnable': 'PurchaseOrder',
    'Outward_NonReturnable': 'BillingDocument',
    'Inward_Returnable': 'ManualEntry',
    'Outward_Returnable': 'BillingDocument',
    'Inward_AgainstOutwardRGP': 'Gatepass',
    'Outward_AgainstInwardRGP': 'Gatepass'
}

const PASS_PREFIX: Record<string, string> = {
    Inward: 'IGP',
    Outward: 'OGP'
}

export default class GatepassService extends cds.ApplicationService {
    async init() {
        this.on('createGatepass', async (req) => {
            const {
                processType, gatepassType, documents,
                weighbridgeRequired, entryGate, expectedReturnDate,
                vehicle, driver, items
            } = req.data as CreateGatepassParams

            if (!processType || !gatepassType) {
                return req.error(400, 'processType and gatepassType are required')
            }

            const isInwardReturnable = processType === 'Inward' && gatepassType === 'Returnable'

            if (!isInwardReturnable && !documents?.length) {
                return req.error(400, 'At least one document number is required')
            }

            if (expectedReturnDate) {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                if (new Date(expectedReturnDate) < today) {
                    return req.error(400, 'Expected return date cannot be in the past')
                }
            }

            const docTypeKey = `${processType}_${gatepassType}`
            const documentType = DOCUMENT_TYPE_MAP[docTypeKey]
            if (!documentType) {
                return req.error(400, `Invalid combination: ${processType} + ${gatepassType}`)
            }

            const sanitizedDocs = (documents || [])
                .map((d: string) => d?.trim())
                .filter(Boolean)

            if (docTypeKey === 'Inward_AgainstOutwardRGP' || docTypeKey === 'Outward_AgainstInwardRGP') {
                const expectedPT = docTypeKey === 'Inward_AgainstOutwardRGP' ? 'Outward' : 'Inward'
                const { Passes: PassesEntity } = this.entities
                const refPasses = await SELECT.from(PassesEntity)
                    .columns('passNumber', 'status', 'processType', 'gatepassType')
                    .where({ passNumber: { in: sanitizedDocs } }) as { passNumber: string; status: string; processType: string; gatepassType: string }[]

                const missing = sanitizedDocs.filter(pn => !refPasses.some(p => p.passNumber === pn))
                if (missing.length) {
                    return req.error(404, `Gatepass not found: ${missing.join(', ')}`)
                }

                for (const p of refPasses) {
                    if (p.processType !== expectedPT || p.gatepassType !== 'Returnable') {
                        return req.error(400, `Gatepass ${p.passNumber} is ${p.processType}/${p.gatepassType}, expected ${expectedPT}/Returnable`)
                    }
                    if (p.status !== 'Completed' && p.status !== 'PartiallyReturned') {
                        return req.error(400, `Gatepass ${p.passNumber} has status '${p.status}', only Completed or Partially Returned gatepasses can be referenced`)
                    }
                }
            }

            const passNumber = await this.generatePassNumber(processType)

            let vehicleId: string | null = null
            if (vehicle?.vehicleNumber?.trim()) {
                vehicleId = await this.findOrCreateVehicle({
                    vehicleNumber: vehicle.vehicleNumber.trim().toUpperCase(),
                    type_ID: vehicle.type || null,
                    transporter: vehicle.transporter?.trim() || 'N/A'
                })
            }

            let driverId: string | null = null
            if (driver?.name?.trim()) {
                driverId = await this.findOrCreateDriver({
                    name: driver.name.trim(),
                    licenseNumber: driver.licenseNumber?.trim() || 'N/A',
                    contactNumber: driver.contactNumber?.trim() || 'N/A'
                })
            }

            let weightId: string | null = null
            if (weighbridgeRequired) {
                const { Weights } = this.entities
                const weightEntry: Record<string, unknown> = { entryWeight: null, exitWeight: null }
                await INSERT.into(Weights).entries(weightEntry)
                weightId = weightEntry.ID as string
            }

            const passData: Partial<Pass> = {
                passNumber,
                status: 'Draft',
                processType,
                gatepassType,
                documentType,
                weighbridgeRequired: weighbridgeRequired ?? false,
                expectedReturnDate: expectedReturnDate || null,
                vehicle_ID: vehicleId,
                driver_ID: driverId,
                entryGate_ID: entryGate || null,
                weight_ID: weightId,
                documents: sanitizedDocs
            }

            const { Passes, PassAuditLogs, GatepassItems } = this.entities
            await INSERT.into(Passes).entries(passData)
            const passId = passData.ID!

            if (items?.length) {
                const itemEntries = items.map((item) => ({
                    pass_ID: passId,
                    lineItem: item.lineItem,
                    documentNumber: item.documentNumber,
                    materialCode: item.materialCode,
                    materialDescription: item.materialDescription,
                    partyName: item.partyName,
                    orderQuantity: item.orderQuantity ?? null,
                    openQuantity: item.openQuantity ?? null,
                    receivedQuantity: item.receivedQuantity ?? null,
                    issueQuantity: item.issueQuantity ?? null,
                    purchaseOrder: item.purchaseOrder || 'N/A',
                    unitOfMeasurement: item.unitOfMeasurement || null
                }))
                await INSERT.into(GatepassItems).entries(itemEntries)
            }

            await INSERT.into(PassAuditLogs).entries({
                pass_ID: passId,
                action: 'Created',
                performedAt: new Date().toISOString(),
                performedBy: req.user.id,
                newValue: JSON.stringify(passData),
                remarks: null
            } as Partial<PassAuditLog>)

            return SELECT.one.from(Passes).where({ ID: passId })
        })

        this.on('sendForApproval', 'Passes', async (req) => {
            const passId = req.params[0] as string

            const pass = await this.getPass(passId)
            if (!pass) return req.error(404, `Pass ${passId} not found`)

            if (pass.status !== 'Draft') {
                return req.error(409, `Pass can only be sent for approval from Draft status, current status is '${pass.status}'`)
            }

            if (!pass.vehicle_ID) {
                return req.error(422, 'Vehicle must be linked before sending for approval')
            }
            if (await this.isDriverRequired(pass.vehicle_ID) && !pass.driver_ID) {
                return req.error(422, 'Driver must be linked before sending for approval')
            }

            if (!pass.entryGate_ID) {
                return req.error(422, 'Entry gate must be selected before sending for approval')
            }

            const { Passes } = this.entities
            await this.updatePassStatus(passId, 'PendingApproval', 'SentForApproval', pass.status, req.user.id, null)
            return SELECT.one.from(Passes).where({ ID: passId })
        })

        this.on('finaliseGatepass', 'Passes', async (req) => {
            const passId = req.params[0] as string

            const pass = await this.getPass(passId)
            if (!pass) return req.error(404, `Pass ${passId} not found`)

            if (pass.status !== 'Draft') {
                return req.error(409, `Pass can only be finalised from Draft status, current status is '${pass.status}'`)
            }

            if (!pass.vehicle_ID) {
                return req.error(422, 'Vehicle must be linked before finalising')
            }
            if (await this.isDriverRequired(pass.vehicle_ID) && !pass.driver_ID) {
                return req.error(422, 'Driver must be linked before finalising')
            }

            if (!pass.entryGate_ID) {
                return req.error(422, 'Entry gate must be selected before finalising')
            }

            const { Passes } = this.entities
            await UPDATE(Passes).set({ approvedBy: 'N/A' }).where({ ID: passId })
            const newStatus = pass.weighbridgeRequired ? 'EntryWeightPending' : 'GateExitPending'
            await this.updatePassStatus(passId, newStatus, 'Finalised', pass.status, req.user.id, null)
            return SELECT.one.from(Passes).where({ ID: passId })
        })

        this.on('approvePass', 'Passes', async (req) => {
            const passId = req.params[0] as string
            const { remarks } = req.data as { remarks?: string | null }

            const pass = await this.getPass(passId)
            if (!pass) return req.error(404, `Pass ${passId} not found`)

            if (pass.status !== 'PendingApproval') {
                return req.error(409, `Pass can only be approved from PendingApproval status, current status is '${pass.status}'`)
            }

            if (!pass.vehicle_ID) {
                return req.error(422, 'Vehicle must be linked before approval')
            }
            if (await this.isDriverRequired(pass.vehicle_ID) && !pass.driver_ID) {
                return req.error(422, 'Driver must be linked before approval')
            }

            if (!pass.entryGate_ID) {
                return req.error(422, 'Entry gate must be selected before approval')
            }

            const { Passes } = this.entities
            const newStatus = pass.weighbridgeRequired ? 'EntryWeightPending' : 'GateExitPending'
            await UPDATE(Passes).set({ approvedAt: new Date().toISOString(), approvedBy: req.user.id }).where({ ID: passId })
            await this.updatePassStatus(passId, newStatus, 'Approved', pass.status, req.user.id, remarks)
            return SELECT.one.from(Passes).where({ ID: passId })
        })

        this.on('finaliseEntryWeight', 'Passes', async (req) => {
            const passId = req.params[0] as string
            const { entryWeight } = req.data as { entryWeight: number }

            const pass = await this.getPass(passId)
            if (!pass) return req.error(404, `Pass ${passId} not found`)

            if (pass.status !== 'EntryWeightPending') {
                return req.error(409, `Entry weight can only be recorded when status is EntryWeightPending, current: '${pass.status}'`)
            }
            if (!entryWeight || entryWeight <= 0) {
                return req.error(422, 'Entry weight must be a positive number')
            }
            if (!pass.weight_ID) {
                return req.error(422, 'No weight record linked to this pass')
            }

            const { Passes, Weights } = this.entities
            await UPDATE(Weights).set({ entryWeight }).where({ ID: pass.weight_ID })
            await this.updatePassStatus(passId, 'ExitWeightPending', 'WeightRecorded', pass.status, req.user.id, 'Entry Weight')
            return SELECT.one.from(Passes).where({ ID: passId })
        })

        this.on('finaliseExitWeight', 'Passes', async (req) => {
            const passId = req.params[0] as string
            const { exitWeight } = req.data as { exitWeight: number }

            const pass = await this.getPass(passId)
            if (!pass) return req.error(404, `Pass ${passId} not found`)

            if (pass.status !== 'ExitWeightPending') {
                return req.error(409, `Exit weight can only be recorded when status is ExitWeightPending, current: '${pass.status}'`)
            }
            if (!exitWeight || exitWeight <= 0) {
                return req.error(422, 'Exit weight must be a positive number')
            }
            if (!pass.weight_ID) {
                return req.error(422, 'No weight record linked to this pass')
            }

            const { Passes, Weights } = this.entities
            const weight = await SELECT.one.from(Weights).where({ ID: pass.weight_ID }) as { entryWeight: number | null } | undefined
            const entryWeight = weight?.entryWeight ?? 0

            if (pass.processType === 'Outward' && exitWeight <= entryWeight) {
                return req.error(422, 'For outward gatepasses, exit weight must be greater than entry weight')
            }
            if (pass.processType === 'Inward' && exitWeight >= entryWeight) {
                return req.error(422, 'For inward gatepasses, exit weight must be less than entry weight')
            }

            await UPDATE(Weights).set({ exitWeight }).where({ ID: pass.weight_ID })
            await this.updatePassStatus(passId, 'GateExitPending', 'WeightRecorded', pass.status, req.user.id, 'Exit Weight')
            return SELECT.one.from(Passes).where({ ID: passId })
        })

        this.on('saveWeights', 'Passes', async (req) => {
            const passId = req.params[0] as string
            const { entryWeight, exitWeight } = req.data as { entryWeight?: number | null; exitWeight?: number | null }

            const pass = await this.getPass(passId)
            if (!pass) return req.error(404, `Pass ${passId} not found`)

            if (pass.status !== 'EntryWeightPending' && pass.status !== 'ExitWeightPending') {
                return req.error(409, `Weights can only be saved when status is EntryWeightPending or ExitWeightPending, current: '${pass.status}'`)
            }
            if (!pass.weight_ID) {
                return req.error(422, 'No weight record linked to this pass')
            }

            const updateData: Record<string, unknown> = {}
            if (pass.status === 'EntryWeightPending' && entryWeight != null) {
                updateData.entryWeight = entryWeight
            }
            if (pass.status === 'ExitWeightPending' && exitWeight != null) {
                updateData.exitWeight = exitWeight
            }

            if (Object.keys(updateData).length > 0) {
                const { Weights } = this.entities
                await UPDATE(Weights).set(updateData).where({ ID: pass.weight_ID })
            }

            const { Passes } = this.entities
            return SELECT.one.from(Passes).where({ ID: passId })
        })

        this.before('UPDATE', 'Weights', async (req) => {
            const weightId = req.data.ID as string
            if (!weightId) return

            const { Passes } = this.entities
            const pass = await SELECT.one.from(Passes).where({ weight_ID: weightId }) as Pass | null
            if (!pass) return

            if (pass.status !== 'EntryWeightPending' && pass.status !== 'ExitWeightPending') {
                return req.error(403, 'Weights cannot be modified after finalisation')
            }

            if (pass.status === 'ExitWeightPending' && req.data.entryWeight !== undefined) {
                return req.error(403, 'Entry weight cannot be modified after finalisation')
            }
        })

        this.on('performExit', 'Passes', async (req) => {
            const passId = req.params[0] as string
            const { exitGate } = req.data as { exitGate: string }

            const pass = await this.getPass(passId)
            if (!pass) return req.error(404, `Pass ${passId} not found`)

            if (pass.status !== 'GateExitPending') {
                return req.error(409, `Exit can only be performed when status is GateExitPending, current: '${pass.status}'`)
            }
            if (!exitGate) {
                return req.error(422, 'Exit gate must be selected')
            }

            const { Gates } = this.entities
            const gate = await SELECT.one.from(Gates).where({ ID: exitGate })
            if (!gate) return req.error(400, 'Invalid exit gate')

            const { Passes } = this.entities
            await UPDATE(Passes).set({ exitGate_ID: exitGate }).where({ ID: passId })
            await this.updatePassStatus(passId, 'Completed', 'ExitPerformed', pass.status, req.user.id, null)
            return SELECT.one.from(Passes).where({ ID: passId })
        })

        this.on('printPass', 'Passes', async (req) => {
            const passId = req.params[0] as string

            const { Passes, Vehicles, VehicleTypes, Drivers, Weights, Gates } = this.entities
            const pass = await SELECT.one.from(Passes).where({ ID: passId }) as Pass | null
            if (!pass) return req.error(404, `Pass ${passId} not found`)

            const vehicle = pass.vehicle_ID ? await SELECT.one.from(Vehicles).where({ ID: pass.vehicle_ID }) as Record<string, unknown> | null : null
            const vehicleType = vehicle?.type_ID ? await SELECT.one.from(VehicleTypes).where({ ID: vehicle.type_ID as string }) as Record<string, unknown> | null : null
            const driver = pass.driver_ID ? await SELECT.one.from(Drivers).where({ ID: pass.driver_ID }) as Record<string, unknown> | null : null
            const weight = pass.weight_ID ? await SELECT.one.from(Weights).where({ ID: pass.weight_ID }) as Record<string, unknown> | null : null
            const entryGate = pass.entryGate_ID ? await SELECT.one.from(Gates).where({ ID: pass.entryGate_ID }) as Record<string, unknown> | null : null
            const exitGate = pass.exitGate_ID ? await SELECT.one.from(Gates).where({ ID: pass.exitGate_ID }) as Record<string, unknown> | null : null

            const { AppConfig } = this.entities
            const config = await SELECT.one.from(AppConfig) as Record<string, unknown> | null
            const companyLogo = (config?.companyLogo as string) || null
            const weightUnit = (config?.weightUnit as string) || 'kg'

            const { GatepassItems } = this.entities
            const firstItem = await SELECT.one.from(GatepassItems).columns('partyName').where({ pass_ID: passId }) as { partyName: string | null } | null

            await this.updateAuditLog(passId, 'Printed', pass.status!, req.user.id, null)

            return buildPrintSlipHtml({
                pass, vehicle, vehicleType, driver, weight,
                entryGate, exitGate, companyLogo, weightUnit,
                partyName: firstItem?.partyName || null
            })
        })

        this.on('rejectPass', 'Passes', async (req) => {
            const passId = req.params[0] as string
            const { remarks } = req.data as { remarks?: string | null }

            const pass = await this.getPass(passId)
            if (!pass) return req.error(404, `Pass ${passId} not found`)

            if (pass.status !== 'PendingApproval') {
                return req.error(409, `Pass can only be rejected from PendingApproval status, current status is '${pass.status}'`)
            }

            const { Passes } = this.entities
            await this.updatePassStatus(passId, 'Rejected', 'Rejected', pass.status, req.user.id, remarks)
            return SELECT.one.from(Passes).where({ ID: passId })
        })

        this.on('cancelPass', 'Passes', async (req) => {
            const passId = req.params[0] as string
            const { remarks } = req.data as { remarks?: string | null }

            const pass = await this.getPass(passId)
            if (!pass) return req.error(404, `Pass ${passId} not found`)

            const uncancellable = ['Cancelled', 'Completed', 'PartiallyReturned', 'Returned']
            if (uncancellable.includes(pass.status!)) {
                return req.error(409, `Pass cannot be cancelled in status: ${pass.status}`)
            }

            const { Passes } = this.entities
            await this.updatePassStatus(passId, 'Cancelled', 'Cancelled', pass.status!, req.user.id, remarks)
            return SELECT.one.from(Passes).where({ ID: passId })
        })

        this.on('fetchDocumentItems', async (req) => {
            const { processType, gatepassType, documents } = req.data as FetchDocItemsParams

            if (!processType || !gatepassType) {
                return req.error(400, 'processType and gatepassType are required')
            }
            if (!documents?.length) {
                return req.error(400, 'At least one document number is required')
            }

            const docNumbers = documents.map((d: string) => d?.trim()).filter(Boolean)
            const combo = `${processType}_${gatepassType}`

            switch (combo) {
                case 'Inward_NonReturnable':
                    return this.fetchPurchaseOrderItems(docNumbers)
                case 'Outward_NonReturnable':
                    return this.fetchBillingDocItems(docNumbers, 'F2')
                case 'Inward_Returnable':
                    return this.fetchMaterialDocItems(docNumbers)
                case 'Outward_Returnable':
                    return this.fetchBillingDocItems(docNumbers, 'JSN')
                case 'Inward_AgainstOutwardRGP':
                    return this.fetchGatepassItems(req, docNumbers, 'receivedQuantity', 'Outward', 'Returnable')
                case 'Outward_AgainstInwardRGP':
                    return this.fetchGatepassItems(req, docNumbers, 'issueQuantity', 'Inward', 'Returnable')
                default:
                    return req.error(400, `Unsupported combination: ${processType} + ${gatepassType}`)
            }
        })

        this.on('updateGatepass', 'Passes', async (req) => {
            const passId = req.params[0] as string
            const { weighbridgeRequired, entryGate, expectedReturnDate, vehicle, driver, items } =
                req.data as { weighbridgeRequired?: boolean; entryGate?: string | null; expectedReturnDate?: string | null; vehicle?: { vehicleNumber?: string; type?: string; transporter?: string } | null; driver?: { name?: string; licenseNumber?: string; contactNumber?: string } | null; items?: Record<string, unknown>[] }

            const pass = await this.getPass(passId)
            if (!pass) return req.error(404, `Pass ${passId} not found`)

            if (pass.status !== 'Draft') {
                return req.error(409, `Pass can only be updated in Draft status, current status is '${pass.status}'`)
            }

            const updateData: Record<string, unknown> = {}

            if (weighbridgeRequired !== undefined) {
                updateData.weighbridgeRequired = weighbridgeRequired

                if (weighbridgeRequired && !pass.weight_ID) {
                    const { Weights } = this.entities
                    const weightEntry: Record<string, unknown> = { entryWeight: null, exitWeight: null }
                    await INSERT.into(Weights).entries(weightEntry)
                    updateData.weight_ID = weightEntry.ID as string
                }
            }

            if (expectedReturnDate !== undefined) {
                if (expectedReturnDate) {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    if (new Date(expectedReturnDate) < today) {
                        return req.error(400, 'Expected return date cannot be in the past')
                    }
                }
                updateData.expectedReturnDate = expectedReturnDate || null
            }

            if (entryGate !== undefined) {
                if (entryGate) {
                    const { Gates } = this.entities
                    const gate = await SELECT.one.from(Gates).where({ ID: entryGate })
                    if (!gate) return req.error(400, 'Invalid entry gate')
                }
                updateData.entryGate_ID = entryGate || null
            }

            if (vehicle !== undefined) {
                if (vehicle?.vehicleNumber?.trim()) {
                    updateData.vehicle_ID = await this.findOrCreateVehicle({
                        vehicleNumber: vehicle.vehicleNumber.trim().toUpperCase(),
                        type_ID: vehicle.type || null,
                        transporter: vehicle.transporter?.trim() || null
                    })
                } else {
                    updateData.vehicle_ID = null
                }
            }

            if (driver !== undefined) {
                if (driver?.name?.trim()) {
                    updateData.driver_ID = await this.findOrCreateDriver({
                        name: driver.name.trim(),
                        licenseNumber: driver.licenseNumber?.trim() || null,
                        contactNumber: driver.contactNumber?.trim() || null
                    })
                } else {
                    updateData.driver_ID = null
                }
            }

            if (Object.keys(updateData).length > 0) {
                const { Passes, PassAuditLogs } = this.entities
                await UPDATE(Passes).set(updateData).where({ ID: passId })
                await INSERT.into(PassAuditLogs).entries({
                    pass_ID: passId,
                    action: 'Updated',
                    performedAt: new Date().toISOString(),
                    performedBy: req.user.id,
                    oldValue: JSON.stringify({ vehicle_ID: pass.vehicle_ID, driver_ID: pass.driver_ID, entryGate_ID: pass.entryGate_ID }),
                    newValue: JSON.stringify(updateData),
                    remarks: null
                } as Partial<PassAuditLog>)
            }

            if (items) {
                const { GatepassItems } = this.entities
                await DELETE.from(GatepassItems).where({ pass_ID: passId })
                if (items.length) {
                    const itemEntries = items.map((item) => ({
                        pass_ID: passId,
                        lineItem: item.lineItem,
                        documentNumber: item.documentNumber,
                        materialCode: item.materialCode,
                        materialDescription: item.materialDescription,
                        partyName: item.partyName,
                        orderQuantity: item.orderQuantity ?? null,
                        openQuantity: item.openQuantity ?? null,
                        receivedQuantity: item.receivedQuantity ?? null,
                        issueQuantity: item.issueQuantity ?? null,
                        purchaseOrder: item.purchaseOrder ?? null,
                        unitOfMeasurement: item.unitOfMeasurement || null
                    }))
                    await INSERT.into(GatepassItems).entries(itemEntries)
                }
            }

            const { Passes } = this.entities
            return SELECT.one.from(Passes).where({ ID: passId })
        })

        await super.init()
    }

    private async getPass(passId: string): Promise<Pass | null> {
        const { Passes } = this.entities
        return await SELECT.one.from(Passes).where({ ID: passId }) as Pass | null
    }

    private async updatePassStatus(
        passId: string,
        newStatus: PassStatus,
        auditAction: AuditAction,
        oldStatus: PassStatus,
        userId: string,
        remarks: string | null | undefined
    ): Promise<void> {
        const { Passes, PassAuditLogs } = this.entities
        await UPDATE(Passes).set({ status: newStatus }).where({ ID: passId })
        await INSERT.into(PassAuditLogs).entries({
            pass_ID: passId,
            action: auditAction,
            performedAt: new Date().toISOString(),
            performedBy: userId,
            oldValue: JSON.stringify({ status: oldStatus }),
            newValue: JSON.stringify({ status: newStatus }),
            remarks: remarks || null
        } as Partial<PassAuditLog>)
    }

    private async updateAuditLog(
        passId: string,
        auditAction: AuditAction,
        currentStatus: PassStatus,
        userId: string,
        remarks: string | null | undefined
    ): Promise<void> {
        const { PassAuditLogs } = this.entities
        await INSERT.into(PassAuditLogs).entries({
            pass_ID: passId,
            action: auditAction,
            performedAt: new Date().toISOString(),
            performedBy: userId,
            oldValue: JSON.stringify({ status: currentStatus }),
            newValue: null,
            remarks: remarks || null
        } as Partial<PassAuditLog>)
    }

    private async generatePassNumber(processType: string): Promise<string> {
        const prefix = PASS_PREFIX[processType]
        const { Passes } = this.entities

        const latest = await SELECT.one
            .from(Passes)
            .columns('passNumber')
            .where({ processType })
            .orderBy('passNumber desc') as Pass | null

        let seq = 1
        if (latest?.passNumber) {
            const num = parseInt(latest.passNumber.split('-')[1], 10)
            if (!isNaN(num)) seq = num + 1
        }

        return `${prefix}-${String(seq).padStart(8, '0')}`
    }

    private async isDriverRequired(vehicleId: string): Promise<boolean> {
        const { Vehicles, VehicleTypes } = this.entities
        const vehicle = await SELECT.one.from(Vehicles).columns('type_ID').where({ ID: vehicleId })
        if (!vehicle?.type_ID) return true
        const vType = await SELECT.one.from(VehicleTypes).columns('requireDriverName').where({ ID: vehicle.type_ID })
        return vType?.requireDriverName !== false
    }

    private async findOrCreateVehicle(
        data: { vehicleNumber: string; type_ID: string | null; transporter: string | null }
    ): Promise<string> {
        const { Vehicles } = this.entities
        const where: Record<string, string> = { vehicleNumber: data.vehicleNumber }
        if (data.type_ID) where.type_ID = data.type_ID
        if (data.transporter) where.transporter = data.transporter

        const existing = await SELECT.one.from(Vehicles).where(where) as Vehicle | null
        if (existing) return existing.ID!

        await INSERT.into(Vehicles).entries(data)
        return (data as Record<string, unknown>).ID as string
    }

    private async findOrCreateDriver(
        data: { name: string; licenseNumber: string | null; contactNumber: string | null }
    ): Promise<string> {
        const { Drivers } = this.entities
        const where: Record<string, string> = { name: data.name }
        if (data.licenseNumber) where.licenseNumber = data.licenseNumber
        if (data.contactNumber) where.contactNumber = data.contactNumber

        const existing = await SELECT.one.from(Drivers).where(where) as Driver | null
        if (existing) return existing.ID!

        await INSERT.into(Drivers).entries(data)
        return (data as Record<string, unknown>).ID as string
    }

    private async resolveSupplierNames(supplierCodes: string[]): Promise<Map<string, string>> {
        const unique = [...new Set(supplierCodes.filter(Boolean))]
        if (!unique.length) return new Map()
        const bpSrv = await cds.connect.to('API_BUSINESS_PARTNER')
        const { A_Supplier } = bpSrv.entities
        const suppliers = await bpSrv.run(
            SELECT.from(A_Supplier)
                .columns('Supplier', 'SupplierName')
                .where({ Supplier: { in: unique } })
        ) as Record<string, unknown>[]
        const nameMap = new Map<string, string>()
        for (const s of suppliers) {
            nameMap.set(s.Supplier as string, String(s.SupplierName || s.Supplier))
        }
        return nameMap
    }

    private async resolveCustomerNames(customerCodes: string[]): Promise<Map<string, string>> {
        const unique = [...new Set(customerCodes.filter(Boolean))]
        if (!unique.length) return new Map()
        const bpSrv = await cds.connect.to('API_BUSINESS_PARTNER')
        const { A_Customer } = bpSrv.entities
        const customers = await bpSrv.run(
            SELECT.from(A_Customer)
                .columns('Customer', 'CustomerName')
                .where({ Customer: { in: unique } })
        ) as Record<string, unknown>[]
        const nameMap = new Map<string, string>()
        for (const c of customers) {
            nameMap.set(c.Customer as string, String(c.CustomerName || c.Customer))
        }
        return nameMap
    }

    private async fetchPurchaseOrderItems(docNumbers: string[]): Promise<NormalizedItem[]> {
        const poSrv = await cds.connect.to('CE_PURCHASEORDER_0001')
        const { PurchaseOrder, PurchaseOrderItem, PurchaseOrderScheduleLine } = poSrv.entities

        const [orders, poItems, schedLines] = await Promise.all([
            poSrv.run(
                SELECT.from(PurchaseOrder)
                    .columns('PurchaseOrder', 'Supplier')
                    .where({ PurchaseOrder: { in: docNumbers } })
            ) as Promise<Record<string, unknown>[]>,
            poSrv.run(
                SELECT.from(PurchaseOrderItem)
                    .columns('PurchaseOrder', 'PurchaseOrderItem', 'Material', 'PurchaseOrderItemText', 'OrderQuantity', 'PurchaseOrderQuantityUnit')
                    .where({ PurchaseOrder: { in: docNumbers } })
            ) as Promise<Record<string, unknown>[]>,
            poSrv.run(
                SELECT.from(PurchaseOrderScheduleLine)
                    .columns('PurchaseOrder', 'PurchaseOrderItem', 'OpenPurchaseOrderQuantity')
                    .where({ PurchaseOrder: { in: docNumbers } })
            ) as Promise<Record<string, unknown>[]>
        ])

        const supplierCodeMap = new Map<string, string>()
        for (const o of orders) {
            supplierCodeMap.set(o.PurchaseOrder as string, String(o.Supplier || ''))
        }

        const supplierNames = await this.resolveSupplierNames([...supplierCodeMap.values()])

        const openQtyMap = new Map<string, number>()
        for (const sl of schedLines) {
            const key = `${sl.PurchaseOrder}_${sl.PurchaseOrderItem}`
            openQtyMap.set(key, (openQtyMap.get(key) || 0) + Number(sl.OpenPurchaseOrderQuantity || 0))
        }

        return poItems.map(item => {
            const supplierCode = supplierCodeMap.get(item.PurchaseOrder as string) || ''
            return {
                lineItem: String(item.PurchaseOrderItem),
                documentNumber: String(item.PurchaseOrder),
                materialCode: String(item.Material || ''),
                materialDescription: String(item.PurchaseOrderItemText || ''),
                partyName: supplierNames.get(supplierCode) || supplierCode,
                orderQuantity: Number(item.OrderQuantity) || null,
                openQuantity: openQtyMap.get(`${item.PurchaseOrder}_${item.PurchaseOrderItem}`) ?? null,
                purchaseOrder: null,
                unitOfMeasurement: String(item.PurchaseOrderQuantityUnit || '') || null
            }
        })
    }

    private async fetchBillingDocItems(docNumbers: string[], billingDocType: string): Promise<NormalizedItem[]> {
        const bdSrv = await cds.connect.to('API_BILLING_DOCUMENT_SRV')
        const { A_BillingDocument, A_BillingDocumentItem } = bdSrv.entities

        const [headers, bdItems] = await Promise.all([
            bdSrv.run(
                SELECT.from(A_BillingDocument)
                    .columns('BillingDocument', 'SoldToParty')
                    .where({ BillingDocument: { in: docNumbers }, BillingDocumentType: billingDocType })
            ) as Promise<Record<string, unknown>[]>,
            bdSrv.run(
                SELECT.from(A_BillingDocumentItem)
                    .columns('BillingDocument', 'BillingDocumentItem', 'Material', 'BillingDocumentItemText', 'BillingQuantity', 'BillingQuantityUnit')
                    .where({ BillingDocument: { in: docNumbers } })
            ) as Promise<Record<string, unknown>[]>
        ])

        const validDocs = new Set(headers.map(h => h.BillingDocument as string))
        const customerCodeMap = new Map<string, string>()
        for (const h of headers) {
            customerCodeMap.set(h.BillingDocument as string, String(h.SoldToParty || ''))
        }

        const customerNames = await this.resolveCustomerNames([...customerCodeMap.values()])

        return bdItems
            .filter(item => validDocs.has(item.BillingDocument as string))
            .map(item => {
                const customerCode = customerCodeMap.get(item.BillingDocument as string) || ''
                return {
                    lineItem: String(item.BillingDocumentItem),
                    documentNumber: String(item.BillingDocument),
                    materialCode: String(item.Material || ''),
                    materialDescription: String(item.BillingDocumentItemText || ''),
                    partyName: customerNames.get(customerCode) || customerCode,
                    orderQuantity: Number(item.BillingQuantity) || null,
                    openQuantity: null,
                    purchaseOrder: null,
                    unitOfMeasurement: String(item.BillingQuantityUnit || '') || null
                }
            })
    }

    private async fetchMaterialDocItems(docNumbers: string[]): Promise<NormalizedItem[]> {
        const matSrv = await cds.connect.to('API_MATERIAL_DOCUMENT_SRV')

        const matItems = await matSrv.run(
            SELECT.from('API_MATERIAL_DOCUMENT_SRV.A_MaterialDocumentItem')
                .columns(
                    'MaterialDocument', 'MaterialDocumentItem', 'Material',
                    'MaterialDocumentItemText', 'Supplier', 'PurchaseOrder',
                    'GoodsMovementType', 'InventorySpecialStockType', 'QuantityInBaseUnit', 'MaterialBaseUnit'
                )
                .where({
                    MaterialDocument: { in: docNumbers },
                    GoodsMovementType: '501',
                    InventorySpecialStockType: 'M'
                })
        ) as Record<string, unknown>[]

        const supplierCodes = matItems.map(item => String(item.Supplier || '')).filter(Boolean)
        const supplierNames = await this.resolveSupplierNames(supplierCodes)

        return matItems.map(item => {
            const supplierCode = String(item.Supplier || '')
            return {
                lineItem: String(item.MaterialDocumentItem),
                documentNumber: String(item.MaterialDocument),
                materialCode: String(item.Material || ''),
                materialDescription: String(item.MaterialDocumentItemText || ''),
                partyName: supplierNames.get(supplierCode) || supplierCode,
                orderQuantity: Number(item.QuantityInBaseUnit) || null,
                openQuantity: null,
                purchaseOrder: String(item.PurchaseOrder || '') || null,
                unitOfMeasurement: String(item.MaterialBaseUnit || '') || null
            }
        })
    }

    private async fetchGatepassItems(
        req: cds.Request,
        passNumbers: string[],
        quantityField: 'receivedQuantity' | 'issueQuantity',
        expectedProcessType: string,
        expectedGatepassType: string
    ): Promise<NormalizedItem[] | Error | undefined> {
        const { Passes, GatepassItems } = this.entities

        const allPasses = await SELECT.from(Passes)
            .columns('ID', 'passNumber', 'status', 'processType', 'gatepassType')
            .where({ passNumber: { in: passNumbers } }) as { ID: string; passNumber: string; status: string; processType: string; gatepassType: string }[]

        for (const p of allPasses) {
            if (p.processType !== expectedProcessType || p.gatepassType !== expectedGatepassType) {
                return req.error(400, `Gatepass ${p.passNumber} is ${p.processType}/${p.gatepassType}, expected ${expectedProcessType}/${expectedGatepassType}`)
            }
            if (p.status !== 'Completed' && p.status !== 'PartiallyReturned') {
                return req.error(400, `Gatepass ${p.passNumber} has status '${p.status}', only Completed or Partially Returned gatepasses can be referenced`)
            }
        }

        const missing = passNumbers.filter(pn => !allPasses.some(p => p.passNumber === pn))
        if (missing.length) {
            return req.error(404, `Gatepass not found: ${missing.join(', ')}`)
        }

        const passes = allPasses
        if (!passes.length) return []
        const passIds = passes.map(p => p.ID)

        const items = await SELECT.from(GatepassItems)
            .where({ pass_ID: { in: passIds } }) as GatepassItem[]

        const refField = quantityField === 'receivedQuantity' ? 'issueQuantity' : 'receivedQuantity'

        return items.map(item => ({
            lineItem: item.lineItem || '',
            documentNumber: item.documentNumber || '',
            materialCode: item.materialCode || '',
            materialDescription: item.materialDescription || '',
            partyName: item.partyName || '',
            orderQuantity: item[refField] ? Number(item[refField]) : (item.orderQuantity ? Number(item.orderQuantity) : null),
            openQuantity: item.openQuantity ? Number(item.openQuantity) : null,
            purchaseOrder: item.purchaseOrder || null,
            unitOfMeasurement: item.unitOfMeasurement || null
        }))
    }
}
