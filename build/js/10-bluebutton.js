/* Blue Button Reference Implementation
   Copyright (c) 2013 by M. Jackson Wilkinson.
   License: Apache */

var BlueButtonData;

function PatientCtrl($scope){
    $scope.patient = BlueButtonData.patient;
}

function EncounterListCtrl($scope){
    $scope.encounters = $.map(BlueButtonData.encounters, function(a){
        return a;
    });
}

function AllergyListCtrl($scope){
    $scope.allergies = $.map(BlueButtonData.allergies, function(a){
        return a;
    });
}

function ImmunizationListCtrl($scope){
    $scope.immunizations = $.map(BlueButtonData.immunizations, function(a){
        return a;
    });
}

function MedicationListCtrl($scope){
    $scope.medications = $.map(BlueButtonData.medications, function(a){
        return a;
    });
}

function ProblemListCtrl($scope){
    $scope.problems = $.map(BlueButtonData.problems, function(a){
        return a;
    });
}

function ProcedureListCtrl($scope){
    $scope.procedures = $.map(BlueButtonData.procedures, function(a){
        return a;
    });
}

function VitalSignListCtrl($scope){
    $scope.vitalSigns = $.map(BlueButtonData.vitalSigns, function(a){
        return a;
    });
}


function BlueButtonCallback(data){
    BlueButtonData = data;
}

$(function(){});
