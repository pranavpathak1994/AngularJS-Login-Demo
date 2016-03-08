'use strict';

var app=angular
  .module('RestSrpingSecruityDemo', [
    'ui.router',
    'ui.bootstrap',
    'ngCookies',
    'toaster'
  ]);

app.config(['$stateProvider','$urlRouterProvider','$httpProvider',function ($stateProvider,$urlRouterProvider,$httpProvider) {
    
	$urlRouterProvider.otherwise('/login');
	
	/**
	 * for authentication using cookie
	 */
	
	$httpProvider.defaults.withCredentials = true;

	/**
	 * to define states
	 */
	
    $stateProvider
      .state('login',{
        templateUrl:'views/login.html',
        controller:'MainController',
        controllerAs: 'vm',
        url:'/login'
    })
    .state('403',{
        templateUrl:'views/403.html',
        url:'/403'
    })
    .state('welcome',{
        templateUrl:'views/welcome.html',
        controller:'MainController',
        controllerAs: 'vm',
        url:'/welcome',
        access: {
             requiredPermissions: ['Admin']
        }
    })
    .state('register',{
        templateUrl:'views/registration.html',
        controller:'MainController',
        controllerAs: 'vm',
        url:'/registration'
    })
    
 }])
 .constant('root','http://localhost:8080/');	//constant for define root url


/**
 * To manage secure pages
 */

app.run(['$location', '$rootScope','$cookies', '$state', '$stateParams',
             function($location, $rootScope, $cookies, $state, $stateParams) {
                 $rootScope.$state = $state;
                 $rootScope.$stateParams = $stateParams;

                 //fired when transition begins
                 $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
                	 
                     if (toState && toState.access) {
                    	 var login=$cookies['isLogin'];
                         if(login==true){
                        	 var isRole=false;
                        	 angular.forEach($rootScope.role, function(value, key) {
                        		 if(toState.access.requiredPermissions.indexOf(value) != -1){
                        			 isRole=true;
                        		  }
                        		});
                        	 
                        	 if(!isRole){
                        		 $state.go("login");
                                 event.preventDefault();
                        	 }
                        		 
                         }else{
                        
                             $state.go("login");
                             event.preventDefault();
                         }
                     }
                     

                     if(toState.url == '/login' && $cookies['isLogin']===true ) {
                    	 $state.go("welcome");
                         event.preventDefault();
                     }

                 });
             }]);


/**
 * main cotroller to manage task
 */

app.controller('MainController',['userServices','$location','$cookies','$http','$rootScope','toaster', function(userServices,$location,$cookies,$http,$rootScope,toaster) {
	
	var vm = this;
	vm.header;

	vm.login=function(){
		
		userServices.login(vm.data).then(function(response) {
				if(response.data.status!="error"){
					$cookies["isLogin"]=true;
					$rootScope.role=response.data.data.roles;
					$location.path("/welcome");
				}
				else{
					toaster.error("", "Incorrect Username or Password.!");
					vm.data.password="";
				}
			},
			function(response) {
				toaster.error("", "Opps, Something is worng..!");
			});
	}
	
	vm.logout=function(){
		
		userServices.logout().then(function(response) {
			console.log("logout");
			$cookies["isLogin"]=false;
			 $location.path("/login");
			},
			function(response) {
				toaster.error("", "Opps, Something is worng..!");
			});
	}
	
	vm.register=function(){
		userServices.register(vm.data).then(function(response) {
			toaster.success({title: "", body:"Registration Successfully."});
				$location.path("/login");
			},
			function(response) {
				toaster.error("", "Opps, Something is worng..!");
			});
	}
	
	vm.getUser=function(){
		
		userServices.getUser(vm.header).then(function(response) {
				vm.data=response.data;
			},
			function(response) {
				toaster.error("", "Opps, Something is worng..!");
			});
	}
}]);

/**
 * various services to call remote server
 */

app.factory('userServices', ['$http','root',function($http,root) {
	  return {
	    login : function(data) {
	    	return $http.post(root+"login",$.param({'username':data.email,'password':data.password}),{headers: { 'Content-Type': 'application/x-www-form-urlencoded'}});
	    },
	    register :function(data){
	    	return $http.post(root+"register.do",data);
	    },
	    getUser :function(header){
	    	return $http.post(root+"home/getUser.do");
	    },
	    logout :function(){
	    	return $http.post(root+"logout");
	    }
	  }
	}]);
