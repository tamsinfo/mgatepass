using { mgatepass } from '../db/schema';

service GatepassService @(requires: ['Administrator', 'WeighbridgeOperator', 'GateOperator', 'Approver']) {

    @readonly entity AppConfig as projection on mgatepass.AppConfig;
    @readonly entity ApprovalRules as projection on mgatepass.ApprovalRules;
    @readonly entity VehicleTypes as projection on mgatepass.VehicleTypes;
    @readonly entity Gates as projection on mgatepass.Gates;
    @readonly entity Vehicles as projection on mgatepass.Vehicles;
    @readonly entity Drivers as projection on mgatepass.Drivers;
    @readonly entity PassAuditLogs as projection on mgatepass.PassAuditLogs;

    @(restrict: [
        { grant: 'READ',   to: ['Administrator', 'WeighbridgeOperator', 'GateOperator', 'Approver'] },
        { grant: 'UPDATE', to: ['Administrator', 'GateOperator', 'Approver'] }
    ])
    entity Passes as projection on mgatepass.Passes;

    @(restrict: [
        { grant: 'READ',   to: ['Administrator', 'WeighbridgeOperator', 'GateOperator', 'Approver'] },
        { grant: 'UPDATE', to: ['Administrator', 'WeighbridgeOperator'] }
    ])
    entity Weights as projection on mgatepass.Weights;

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

    @(requires: ['Administrator', 'GateOperator'])
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

    @(requires: ['Administrator', 'Approver'])
    action approveGatepass(passId : UUID, remarks : String(500));

    @(requires: ['Administrator', 'Approver'])
    action rejectGatepass(passId : UUID, remarks : String(500));

    @(requires: ['Administrator', 'GateOperator', 'Approver'])
    action cancelGatepass(passId : UUID, remarks : String(500));
}
