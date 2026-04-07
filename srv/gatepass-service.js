const cds = require('@sap/cds')

const DOCUMENT_TYPE_MAP = {
    'Inward_NonReturnable': 'PurchaseOrder',
    'Outward_NonReturnable': 'BillingDocument',
    'Inward_Returnable': 'GoodsReceivedNote',
    'Outward_Returnable': 'BillingDocument',
    'Inward_AgainstOutwardRGP': 'Gatepass',
    'Outward_AgainstInwardRGP': 'Gatepass'
}

const PASS_PREFIX = {
    Inward: 'IGP',
    Outward: 'OGP'
}

class GatepassService extends cds.ApplicationService {
    async init() {
        const { Passes, Vehicles, Drivers, Weights, PassAuditLogs } = this.entities

        this.on('createGatepass', async (req) => {
            const { processType, gatepassType, documents, entryGate, expectedReturnDate, vehicle, driver } = req.data

            if (!processType || !gatepassType) {
                return req.error(400, 'processType and gatepassType are required')
            }
            if (!vehicle?.vehicleNumber?.trim()) {
                return req.error(400, 'vehicle.vehicleNumber is required')
            }
            if (!driver?.name?.trim()) {
                return req.error(400, 'driver.name is required')
            }
            if (!entryGate) {
                return req.error(400, 'entryGate is required')
            }

            const docTypeKey = `${processType}_${gatepassType}`
            const documentType = DOCUMENT_TYPE_MAP[docTypeKey]
            if (!documentType) {
                return req.error(400, `Invalid combination: ${processType} + ${gatepassType}`)
            }

            const sanitizedVehicle = {
                vehicleNumber: vehicle.vehicleNumber.trim().toUpperCase(),
                type_ID: vehicle.type || null,
                transporter: vehicle.transporter?.trim() || null
            }

            const sanitizedDriver = {
                name: driver.name.trim(),
                licenseNumber: driver.licenseNumber?.trim() || null,
                contactNumber: driver.contactNumber?.trim() || null
            }

            const sanitizedDocs = documents
                ?.map(d => d?.trim())
                .filter(Boolean) || []

            const passNumber = await this._generatePassNumber(processType)
            const vehicleId = await this._findOrCreateVehicle(sanitizedVehicle)
            const driverId = await this._findOrCreateDriver(sanitizedDriver)

            const { ID: weightId } = await INSERT.into(Weights).entries({
                entryWeight: null,
                exitWeight: null
            })

            const passData = {
                passNumber,
                status: 'Draft',
                processType,
                gatepassType,
                documentType,
                expectedReturnDate: expectedReturnDate || null,
                vehicle_ID: vehicleId,
                driver_ID: driverId,
                entryGate_ID: entryGate,
                weight_ID: weightId,
                documents: sanitizedDocs
            }

            const { ID: passId } = await INSERT.into(Passes).entries(passData)

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

    async _generatePassNumber(processType) {
        const { Passes } = this.entities
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

    async _findOrCreateVehicle(data) {
        const { Vehicles } = this.entities

        const where = { vehicleNumber: data.vehicleNumber }
        if (data.type_ID) where.type_ID = data.type_ID
        if (data.transporter) where.transporter = data.transporter

        const existing = await SELECT.one.from(Vehicles).where(where)
        if (existing) return existing.ID

        const { ID } = await INSERT.into(Vehicles).entries(data)
        return ID
    }

    async _findOrCreateDriver(data) {
        const { Drivers } = this.entities

        const where = { name: data.name }
        if (data.licenseNumber) where.licenseNumber = data.licenseNumber
        if (data.contactNumber) where.contactNumber = data.contactNumber

        const existing = await SELECT.one.from(Drivers).where(where)
        if (existing) return existing.ID

        const { ID } = await INSERT.into(Drivers).entries(data)
        return ID
    }
}

module.exports = GatepassService
