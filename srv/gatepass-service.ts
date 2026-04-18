import cds from '@sap/cds'
import type { Pass, Vehicle, Driver, PassAuditLog, createGatepass } from '#cds-models/GatepassService'
import type { DocumentType, PassStatus, AuditAction } from '#cds-models/mgatepass'

type CreateGatepassParams = (typeof createGatepass)['__parameters']

const DOCUMENT_TYPE_MAP: Record<string, DocumentType> = {
    'Inward_NonReturnable': 'PurchaseOrder',
    'Outward_NonReturnable': 'BillingDocument',
    'Inward_Returnable': 'GoodsReceivedNote',
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
                vehicle, driver
            } = req.data as CreateGatepassParams

            if (!processType || !gatepassType) {
                return req.error(400, 'processType and gatepassType are required')
            }
            if (!documents?.length) {
                return req.error(400, 'At least one document number is required')
            }

            const docTypeKey = `${processType}_${gatepassType}`
            const documentType = DOCUMENT_TYPE_MAP[docTypeKey]
            if (!documentType) {
                return req.error(400, `Invalid combination: ${processType} + ${gatepassType}`)
            }

            const sanitizedDocs = documents
                .map((d: string) => d?.trim())
                .filter(Boolean)

            if (!sanitizedDocs.length) {
                return req.error(400, 'Document numbers cannot be empty')
            }

            const passNumber = await this.generatePassNumber(processType)

            let vehicleId: string | null = null
            if (vehicle?.vehicleNumber?.trim()) {
                vehicleId = await this.findOrCreateVehicle({
                    vehicleNumber: vehicle.vehicleNumber.trim().toUpperCase(),
                    type_ID: vehicle.type || null,
                    transporter: vehicle.transporter?.trim() || null
                })
            }

            let driverId: string | null = null
            if (driver?.name?.trim()) {
                driverId = await this.findOrCreateDriver({
                    name: driver.name.trim(),
                    licenseNumber: driver.licenseNumber?.trim() || null,
                    contactNumber: driver.contactNumber?.trim() || null
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

            const { Passes, PassAuditLogs } = this.entities
            await INSERT.into(Passes).entries(passData)
            const passId = passData.ID!

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
            await this.updatePassStatus(passId, 'ExitWeightPending', 'WeightRecorded', pass.status, req.user.id, null)
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
            await UPDATE(Weights).set({ exitWeight }).where({ ID: pass.weight_ID })
            await this.updatePassStatus(passId, 'GateExitPending', 'WeightRecorded', pass.status, req.user.id, null)
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

            if (pass.status === 'Cancelled') {
                return req.error(409, 'Pass is already cancelled')
            }

            const { Passes } = this.entities
            await this.updatePassStatus(passId, 'Cancelled', 'Cancelled', pass.status!, req.user.id, remarks)
            return SELECT.one.from(Passes).where({ ID: passId })
        })

        this.on('updateGatepass', 'Passes', async (req) => {
            const passId = req.params[0] as string
            const { weighbridgeRequired, entryGate, expectedReturnDate, vehicle, driver } =
                req.data as { weighbridgeRequired?: boolean; entryGate?: string | null; expectedReturnDate?: string | null; vehicle?: { vehicleNumber?: string; type?: string; transporter?: string } | null; driver?: { name?: string; licenseNumber?: string; contactNumber?: string } | null }

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
}
