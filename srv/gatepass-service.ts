import cds from '@sap/cds'

const DOCUMENT_TYPE_MAP: Record<string, string> = {
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
        const { Passes, Vehicles, Drivers, Weights, PassAuditLogs } = this.entities

        this.on('createGatepass', async (req) => {
            const {
                processType, gatepassType, documents,
                weighbridgeRequired, entryGate, expectedReturnDate,
                vehicle, driver
            } = req.data

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

            const passNumber = await this.generatePassNumber(Passes, processType)

            let vehicleId: string | null = null
            if (vehicle?.vehicleNumber?.trim()) {
                vehicleId = await this.findOrCreateVehicle(Vehicles, {
                    vehicleNumber: vehicle.vehicleNumber.trim().toUpperCase(),
                    type_ID: vehicle.type || null,
                    transporter: vehicle.transporter?.trim() || null
                })
            }

            let driverId: string | null = null
            if (driver?.name?.trim()) {
                driverId = await this.findOrCreateDriver(Drivers, {
                    name: driver.name.trim(),
                    licenseNumber: driver.licenseNumber?.trim() || null,
                    contactNumber: driver.contactNumber?.trim() || null
                })
            }

            let weightId: string | null = null
            if (weighbridgeRequired) {
                const result = await INSERT.into(Weights).entries({
                    entryWeight: null,
                    exitWeight: null
                })
                weightId = result.req.data.ID
            }

            const passData = {
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

            const insertResult = await INSERT.into(Passes).entries(passData)
            const passId = insertResult.req.data.ID

            await INSERT.into(PassAuditLogs).entries({
                pass_ID: passId,
                action: 'Created',
                performedAt: new Date().toISOString(),
                performedBy: req.user.id,
                newValue: JSON.stringify(passData),
                remarks: null
            })

            return SELECT.one.from(Passes).where({ ID: passId })
        })

        await super.init()
    }

    private async generatePassNumber(Passes: any, processType: string): Promise<string> {
        const prefix = PASS_PREFIX[processType]

        const latest = await SELECT.one
            .from(Passes)
            .columns('passNumber')
            .where({ processType })
            .orderBy('passNumber desc')

        let seq = 1
        if (latest?.passNumber) {
            const num = parseInt(latest.passNumber.split('-')[1], 10)
            if (!isNaN(num)) seq = num + 1
        }

        return `${prefix}-${String(seq).padStart(8, '0')}`
    }

    private async findOrCreateVehicle(
        Vehicles: any,
        data: { vehicleNumber: string; type_ID: string | null; transporter: string | null }
    ): Promise<string> {
        const where: Record<string, string> = { vehicleNumber: data.vehicleNumber }
        if (data.type_ID) where.type_ID = data.type_ID
        if (data.transporter) where.transporter = data.transporter

        const existing = await SELECT.one.from(Vehicles).where(where)
        if (existing) return existing.ID

        const result = await INSERT.into(Vehicles).entries(data)
        return result.req.data.ID
    }

    private async findOrCreateDriver(
        Drivers: any,
        data: { name: string; licenseNumber: string | null; contactNumber: string | null }
    ): Promise<string> {
        const where: Record<string, string> = { name: data.name }
        if (data.licenseNumber) where.licenseNumber = data.licenseNumber
        if (data.contactNumber) where.contactNumber = data.contactNumber

        const existing = await SELECT.one.from(Drivers).where(where)
        if (existing) return existing.ID

        const result = await INSERT.into(Drivers).entries(data)
        return result.req.data.ID
    }
}
