using { mgatepass } from '../db/schema';

service AdminService @(requires: 'Administrator') {

    @(restrict: [
        { grant: 'READ', to: 'Administrator' },
        { grant: 'UPDATE', to: 'Administrator' }
    ])
    entity AppConfig as projection on mgatepass.AppConfig;

    @(restrict: [
        { grant: 'READ', to: 'Administrator' },
        { grant: 'UPDATE', to: 'Administrator' }
    ])
    entity ApprovalRules as projection on mgatepass.ApprovalRules;

    entity VehicleTypes as projection on mgatepass.VehicleTypes;
    entity Gates as projection on mgatepass.Gates;
    entity Vehicles as projection on mgatepass.Vehicles;
    entity Drivers as projection on mgatepass.Drivers;

    @(restrict: [
        { grant: 'READ', to: 'Administrator' },
        { grant: 'UPDATE', to: 'Administrator' }
    ])
    entity Passes as projection on mgatepass.Passes;

    @(restrict: [
        { grant: 'READ', to: 'Administrator' },
        { grant: 'UPDATE', to: 'Administrator' }
    ])
    entity Weights as projection on mgatepass.Weights;

    @readonly
    entity PassAuditLogs as projection on mgatepass.PassAuditLogs;

    type VehicleInput {
        vehicleNumber : String(20);
        type          : UUID;
        transporter   : String(100);
    }

    type DriverInput {
        name          : String(100);
        licenseNumber : String(50);
        contactNumber : String(20);
    }

    action createGatepass(
        passNumber   : String(20),
        processType  : mgatepass.ProcessType,
        gatepassType : mgatepass.GatepassType,
        documentType : String(50),
        documents    : many String(50),
        entryGate    : UUID,
        exitGate     : UUID,
        vehicle      : VehicleInput,
        driver       : DriverInput
    ) returns Passes;

    action deleteGatepass(passId : UUID);
}
