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

    action deleteGatepass(passId : UUID);
}
