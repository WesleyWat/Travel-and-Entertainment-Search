//animation
'use strict'
var app = angular.module('myApp',['ngAnimate']);

app.controller('myCtrl', function($scope){
	$scope.reviewCheck = false;
	$scope.change = false;
	$scope.selectLocation = "current";
	$scope.setReviewCheck = function(){
		$scope.reviewCheck = false;
	}
	$scope.reviewFalse = function(){
		$scope.reviewCheck=false;
	}
	$scope.reviewTrue = function(){
		$scope.reviewCheck= true;
	}

	$scope.containTrue = function(){
		$scope.change = true;
	}

	$scope.containFalse = function(){
		$scope.change = false;
	}

	$scope.test = function(){
		if($("#keyword").val().trim() == "")
			return true;
		else if($("#location").val().trim() == "" && $scope.selectLocation == "other")
			return true;
		else
			return false;
	}

})

app.controller('refresh', function($scope,$compile){
    $scope.refresh = function(need){
        $("#content").html($compile(need)($scope));
    }
    $scope.refreshF = function(need){
    	$("#favoritesContainer").html($compile(need)($scope));
    }
})
