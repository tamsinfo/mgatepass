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
        { grant: 'READ',              to: ['Administrator', 'WeighbridgeOperator', 'GateOperator', 'Approver'] },
        { grant: 'sendForApproval',   to: ['Administrator', 'GateOperator'] },
        { grant: 'approvePass',       to: ['Administrator', 'Approver'] },
        { grant: 'rejectPass',        to: ['Administrator', 'Approver'] },
        { grant: 'cancelPass',        to: ['Administrator', 'GateOperator', 'Approver'] },
        { grant: 'updateGatepass',         to: ['Administrator', 'GateOperator'] },
        { grant: 'finaliseGatepass',      to: ['Administrator', 'GateOperator'] },
        { grant: 'finaliseEntryWeight',   to: ['Administrator', 'WeighbridgeOperator'] },
        { grant: 'finaliseExitWeight',    to: ['Administrator', 'WeighbridgeOperator'] }
    ])
    entity Passes as projection on mgatepass.Passes
        actions {
            action sendForApproval() returns Passes;
            action approvePass(remarks : String(500)) returns Passes;
            action rejectPass(remarks : String(500)) returns Passes;
            action cancelPass(remarks : String(500)) returns Passes;
            action finaliseGatepass() returns Passes;
            action finaliseEntryWeight(entryWeight : Decimal(10, 3)) returns Passes;
            action finaliseExitWeight(exitWeight : Decimal(10, 3)) returns Passes;
            action updateGatepass(
                weighbridgeRequired : Boolean,
                entryGate           : UUID,
                expectedReturnDate  : Date,
                vehicle             : VehicleInput,
                driver              : DriverInput
            ) returns Passes;
        };

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
        processType         : mgatepass.ProcessType,
        gatepassType        : mgatepass.GatepassType,
        documents           : many String(50),
        weighbridgeRequired : Boolean,
        entryGate           : UUID,
        expectedReturnDate  : Date,
        vehicle             : VehicleInput,
        driver              : DriverInput
    ) returns Passes;
}
