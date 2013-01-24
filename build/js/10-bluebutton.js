/* Blue Button Reference Implementation
   Copyright (c) 2013 by M. Jackson Wilkinson.
   License: Apache */

var BlueButtonData;

function PatientController($scope){
    $scope.patient = BlueButtonData.patient;
}

function EncounterController($scope){
    $scope.encounters = $.map(BlueButtonData.encounters, function(a){
        return a;
    });


}

function AllergyController($scope){
    $scope.allergies = $.map(BlueButtonData.allergies, function(a){
        return a;
    });
}

function ImmunizationController($scope){
    $scope.immunizations = $.map(BlueButtonData.immunizations, function(a){
        return a;
    });
}

function MedicationController($scope){
    $scope.medications = $.map(BlueButtonData.medications, function(a){
        return a;
    });
}

function ProblemController($scope){
    $scope.problems = $.map(BlueButtonData.problems, function(a){
        return a;
    });
}

function ProcedureController($scope){
    $scope.procedures = $.map(BlueButtonData.procedures, function(a){
        return a;
    });
}

function VitalSignController($scope){
    $scope.vitalSigns = $.map(BlueButtonData.vitalSigns, function(a){
        return a;
    });
}


function BlueButtonCallback(data){
    BlueButtonData = data;
}

$(function(){});
