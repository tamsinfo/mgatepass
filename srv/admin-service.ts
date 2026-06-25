import cds from '@sap/cds'

export default class AdminService extends cds.ApplicationService {
    async init() {
        const { VehicleTypes, Gates } = this.entities

        this.before(['CREATE', 'UPDATE'], VehicleTypes, (req) => {
            if (req.event === 'UPDATE' && !('name' in req.data)) return
            if (!req.data.name?.trim()) {
                return req.error(400, 'Vehicle type name is required')
            }
        })

        this.before(['CREATE', 'UPDATE'], Gates, (req) => {
            if (req.event === 'UPDATE' && !('name' in req.data)) return
            if (!req.data.name?.trim()) {
                return req.error(400, 'Gate name is required')
            }
        })

        await super.init()
    }
}
